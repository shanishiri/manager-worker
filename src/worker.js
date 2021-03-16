const {DISCONNECT, DONE} = require("./utils");
const {sleep, writeMessageToFile} = require("./utils");

const LOCALHOST = '127.0.0.1';
let isRunning = false;

async function handleWorker(app) {

    app.listen(0, LOCALHOST);
    console.log(`Worker ${process.pid} started`);

    process.on('message', async function (message) {
        let pid = process.pid;
        console.log(`Worker ${pid} receives message '${JSON.stringify(message)}'`);

        if (message.message === DISCONNECT) {
            if (!isRunning) {
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
            process.send({message: DONE});
            isRunning = false;
        }
    })
}

module.exports = {handleWorker};