const {sleep, writeMessageToFile} = require("./utils");
let isRunning = false;

async function handleWorker(app) {
    app.listen(0, '127.0.0.1');
    console.log(`Worker ${process.pid} started`);

    process.on('message', async function (message) {
        let pid = process.pid;
        console.log(`Worker ${pid} receives message '${JSON.stringify(message)}'`);

        if (message.message === "disconnect") {
            if(!isRunning){
                console.log(`Worker ${pid} is disconnected`);
                process.exit(0);
            }
        } else {
            isRunning = true;
            await sleep(5000);
            console.log(`Worker ${pid} complete sleep`);
            //TODO: use Q for writing to the same file from different processes in parallel
            await writeMessageToFile(message.message + pid);
            console.log(`Worker ${pid} finished`);
            process.send({message: "done"});
            isRunning = false;
        }
    })
}

module.exports = {handleWorker};