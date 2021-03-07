const { RateLimiterRedis } = require("rate-limiter-flexible");
const { MemoryStore } = require("express-session");
const { RateLimiterMemory } = require("rate-limiter-flexible");

var rateLimiter;

module.exports = {
	start: function () {
		rateLimiter = new RateLimiterMemory({
			storeClient: MemoryStore,
			points: 60,
			duration: 5
		});
	},

	/**
	 * @returns {RateLimiterRedis}
	 */
	getRateLimiter: function () {
		return rateLimiter;
	}
};
