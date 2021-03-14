'use strict';

// import express from 'express'
// import os from 'os'
// import * as cluster from 'cluster'
const {sleep} =  require("./utils");

const cluster = require('cluster');
const express = require('express');

let bodyParser = require('body-parser');


// const numCPUs = os.cpus().length;
// let workers = [];
let app = express();

async function handler() {
    function createWorker() {
        const worker = cluster.fork();
        // workers.push(worker);

        // Listen for messages from worker
        worker.on('message', function (message) {
            console.log(`Master ${process.pid} recevies message '${JSON.stringify(message)}' from worker ${worker.process.pid}`);
        });
        return worker;
    }

    function handleMaster() {
        console.log(`Master ${process.pid} is running`);
        // app.use(bodyParser.urlencoded({extended: false}));
        // app.use(bodyParser.json());

        // app.get('/', function (req, res) {
        //     res.send('Hello World!');
        // });

        app.post('/messages', function (req, res) {
            // console.log(req.body);
            let worker = createWorker();
            console.log(`Master ${process.pid} sends message to worker ${worker.process.pid}...`);
            //TODO: pass on the req.body.message
            worker.send({message: "message"});
            res.send('POST message')
        });

        app.listen(8000);

        // Fork workers
        // for (let i = 0; i < numCPUs; i++) {
        //     console.log(`Forking process number ${i}...`);
        //     createWorker();
        // }


        cluster.on('exit', (worker, code, signal) => {
            console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
            console.log('Starting a new worker');
            createWorker();
        });
    }

    function handleWorker() {
// Workers share the TCP connection in this server
//         let app = express();
//
//         app.get('/', function (req, res) {
//             res.send('Hello World!');
//         });
//
//     All workers use this port
        app.listen(0,'127.0.0.1');
        console.log(`Worker ${process.pid} started`);

        process.on('message', async function (message) {
            console.log(`Worker ${process.pid} recevies message '${JSON.stringify(message)}'`);
            await sleep(5000);
            console.log(`Worker ${process.pid} complete sleep`);
            //TODO: print content message to shared file
        });

        // console.log(`Worker ${process.pid} sends message to master...`);
        // process.send({msg: `Message from worker ${process.pid}`});
        //
        // console.log(`Worker ${process.pid} finished`);
    }

    if (cluster.isMaster) {
        handleMaster();
    } else {
        handleWorker();
    }
}

module.exports = {
   handler
};


