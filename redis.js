const Redis = require("ioredis");

const settings = {
	host: process.env.REDIS_IP,
	port: process.env.REDIS_PORT,
	password: process.env.REDIS_PASSWORD
};

const redisClient = new Redis(settings);

redisClient.on("error", function (error) {
	console.error(error);
});

redisClient.on("connect", function () {
	console.log(`Redis connected: ${process.env.REDIS_IP}`);
});

redisClient.on("exit", function () {
	redisClient.quit();
});

module.exports = redisClient;
