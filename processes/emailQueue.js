const Queue = require("bull");
const emailProcess = require("../processes/emailProcess");

const emailQueue = new Queue("emailQueue", {
    redis: {
        host: process.env.REDIS_IP,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    },
    // Limit queue to max 30 jobs per 2.7 minutes
    limiter: {
        max: 30,
        duration: 162000
    }
});

// this is the function to use in your app
const sendEmailToQueue = data => {
    emailQueue.add("SendMarketingEmail", data, {
        attempts: 3,
        priority: 1
    });
};

// add process for this queue
emailQueue.process("SendMarketingEmail", emailProcess);

module.exports = { emailQueue, sendEmailToQueue };
