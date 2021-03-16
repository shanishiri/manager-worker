'use strict';

const {handleMaster} = require("./master");
const {handleWorker} = require("./worker");
const cluster = require('cluster');
const express = require('express');
const bodyParser = require('body-parser');

let app = express();

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

async function handler() {
    try {
        if (cluster.isMaster) {
            await handleMaster(app, cluster);
        } else {
           await handleWorker(app);
        }
    } catch (e) {
        console.log("Got exception: " + e)
    }
}

handler();
