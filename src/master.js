let messagesApiCounter = 0;
let workerPidToCreationDateMap = new Map();
let pidToWorkerMap = new Map();
let busyWorkers = new Set();
const passedTime = 20000;

function getWorker(workers, cluster) {
    for (const id in workers) {
        const worker = workers[id];
        if (worker) {
            let pid = worker.process.pid;
            const workerCreationTime = workerPidToCreationDateMap.get(pid);
            const lastValidTime = new Date(new Date() - passedTime);
            if (workerCreationTime < lastValidTime) {
                removeWorker(pid);
            } else {
                if (!busyWorkers.has(pid)) {
                    return worker;
                }
            }
        }
    }
    return createWorker(cluster);
}

function removeWorker(pid) {
    console.log(`Going to remove worker ${pid}`);
    let workerToDisconnect = pidToWorkerMap.get(pid);
    if (workerToDisconnect) {
        workerToDisconnect.send({message: "disconnect"});
        workerPidToCreationDateMap.delete(pid);
        pidToWorkerMap.delete(pid);
    }
}

function removeOldWorkers() {
    const lastValidTime = new Date(new Date() - passedTime);
    for (let [key, value] of  workerPidToCreationDateMap.entries()) {
        if (value < lastValidTime) {
            removeWorker(key);
        }
    }
}

function listenToMessageEvent(worker) {
    worker.on('message', function (message) {
        let workerPid = worker.process.pid;
        console.log(`Master ${process.pid} receives message '${JSON.stringify(message)}' from worker ${workerPid}`);
        if (message.message === "done") {
            busyWorkers.delete(workerPid);
        }
    });
}

function createWorker(cluster) {
    const worker = cluster.fork();
    const pid = worker.process.pid;
    workerPidToCreationDateMap.set(pid, new Date());
    pidToWorkerMap.set(pid, worker);
    console.log(`Worker ${pid} was created`);
    listenToMessageEvent(worker);
    return worker;
}

function getEligibleWorker(cluster) {
    let worker;
    let workers = cluster.workers;
    if (Object.keys(workers).length > 0) {
        worker = getWorker(workers, cluster);
    } else {
        worker = createWorker(cluster);
    }
    return worker;
}

async function handleMaster(app, cluster) {
    console.log(`Master ${process.pid} is running`);

    setInterval(function () {
        console.log("Master is checking for old workers to remove");
        removeOldWorkers();
    }, 20000);

    app.get('/statistics', function (req, res) {
        let result = {
            "active_instances": `${Object.keys(cluster.workers).length}`,
            "total_invocation": `${messagesApiCounter}`
        };
        res.send(result);
    });

    app.post('/messages', function (req, res) {
        messagesApiCounter++;

        let worker = getEligibleWorker(cluster);
        let pid = worker.process.pid;
        console.log(`Master ${process.pid} sends message to worker ${pid}...`);
        //TODO: solve parsing body issue and pass on the req.body.message
        worker.send({message: "message"});
        busyWorkers.add(pid);
        res.send('POST successfully')
    });

    app.listen(8000);
}

module.exports = {handleMaster};