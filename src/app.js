'use strict';

const {sleep, writeMessageToFile} = require("./utils");

const cluster = require('cluster');
const express = require('express');

let app = express();

const bodyParser = require('body-parser');
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

let messagesApiCounter = 0;

function getRunningWorker(workers) {
    for (const id in workers) {
        if (workers[id]) {
            return workers[id];
        }
    }
}

async function handler() {
    function createWorker() {
        const worker = cluster.fork();

        worker.on('message', function (message) {
            console.log(`Master ${process.pid} receives message '${JSON.stringify(message)}' from worker ${worker.process.pid}`);
        });
        return worker;
    }

    function handleMaster() {
        console.log(`Master ${process.pid} is running`);

        app.get('/statistics', function (req, res) {
            let result = {
                "active_instances": `${Object.keys(cluster.workers).length}`,
                "total_invocation": `${messagesApiCounter}`
            };
            res.send(result);
        });

        app.post('/messages', function (req, res) {
            messagesApiCounter++;
            let worker;
            // console.log(req.body);
            let workers = cluster.workers;
            let workersNum = Object.keys(workers).length;
            if (workersNum > 0) {
                worker = getRunningWorker(workers);
            } else {
                worker = createWorker();
            }

            console.log(`Master ${process.pid} sends message to worker ${worker.process.pid}...`);
            //TODO: solve parsing body issue and pass on the req.body.message
            worker.send({message: "message"});
            res.send('POST successfully')
        });

        app.listen(8000);
    }

    function handleWorker() {

        app.listen(0, '127.0.0.1');
        console.log(`Worker ${process.pid} started`);

        process.on('message', async function (message) {
            let pid = process.pid;
            console.log(`Worker ${pid} receives message '${JSON.stringify(message)}'`);
            await sleep(5000);
            console.log(`Worker ${pid} complete sleep`);
            //TODO: use Q for writing to the same file from different processes in parallel
            await writeMessageToFile(message.message + pid);
            console.log(`Worker ${pid} finished`);
            process.exit(0);
        })
    }

    try {
        if (cluster.isMaster) {
            handleMaster();
        } else {
            handleWorker();
        }
    } catch (e) {
        console.log("Got exception: " + e)
    }
}

module.exports = {
    handler
};

handler();
