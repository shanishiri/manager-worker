async function sleep(ms) {
    console.info(`Worker - Going to sleep for ${ms} milliseconds...`);
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = {sleep}