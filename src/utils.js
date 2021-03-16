const fs = require('fs');
const lockfile = require('proper-lockfile');
const DISCONNECT = "disconnect";
const DONE = "done";

const fileName = "messages.txt";

async function sleep(ms) {
    console.info(`Worker - Going to sleep for ${ms} milliseconds...`);
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


async function writeMessageToFile(message) {
    console.log(`writing to file: ${message}`);

    try {
        fs.closeSync(fs.openSync(fileName, 'a'));
        let release = await lockfile.lock(fileName);
        await fs.promises.appendFile(fileName, message + " ");
        console.log("\nFile Contents of file after append:",
            fs.readFileSync(fileName, "utf8"));
        release();
    } catch (e) {
        console.log("error: " + e);
        //TODO: retry operation
    }
}

module.exports = {sleep, writeMessageToFile, DISCONNECT, DONE};