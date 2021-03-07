const winston = require("winston");
var { Loggly } = require("winston-loggly-bulk");
const config = require("../config.json");

module.exports = {
	/**
	 * @returns {winston}
	 */
	get: function () {
		return winston;
	},

	init: function () {
		winston.add(
			new Loggly({
				token: config.loggly_token,
				subdomain: "uuwuu",
				tags: ["site", "Winston-NodeJS"],
				json: true
			})
		);
	}
};
