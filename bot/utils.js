const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const { Player } = require("@zikeji/hypixel/dist/methods/player");

module.exports = {
	getErrorEmbed: function (message) {
		var embed = new Discord.MessageEmbed();
		embed.setColor(16711680);
		embed.setTitle(message);
		return embed;
	},

	/**
	 * TODO: add 0's to the date
	 * Formats epoch time as `YYYY/MM/dd hh:mm`
	 * @param {String|Number} time Epoch time
	 * @returns {String} Formatted time
	 */
	formatEpochTime: function (time) {
		var date = new Date(time);
		return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()} ${
			(date.getUTCHours() + "").length == 1 ? "0" + date.getUTCHours() : date.getUTCHours()
		}:${(date.getUTCMinutes() + "").length === 1 ? "0" + date.getUTCMinutes() : date.getUTCMinutes()}`;
	},

	/**
	 * Rounds `number` down to the greatest integer less than or equal to `number`
	 * @param {Number|String} number Number to round
	 * @returns {Number} Rounded number
	 */
	roundDown: function (number) {
		return Math.floor(number);
	},

	/**
	 * Rounds `number` to `places` decimal places
	 * @param {Number|String} number Number to round
	 * @param {Number|String} places Places to round to
	 * @returns {Number} Rounded number
	 */
	roundTo: function (number, places) {
		return number.toFixed(places);
	},

	/**
	 * Rounds `number` up to the lowest integer great than or equal to `number`
	 * @param {Number|String} number Number to round
	 * @returns {Number} Rounded number
	 */
	roundUp: function (number) {
		return Math.ceil(number);
	},

	/**
	 * Gets network level from their network exp
	 * @param {Number|String} networkExp
	 * @returns {Number} Network Level
	 */
	getHypixelLevel: function (networkExp) {
		return (Math.sqrt(networkExp + 15312.5) - 125 / Math.sqrt(2)) / (25 * Math.sqrt(2));
	},

	/**
	 * Gets player rank
	 * @param {Player} player
	 * @returns {"null"|"VIP"|"VIP_PLUS"|"MVP_PLUS"|"MVP_PLUS_PLUS"} player rank
	 */
	getPlayerRank: function (player) {
		let playerRank;
		if (player.rank === "NORMAL") {
			playerRank = player.newPackageRank || packageRank || null;
		} else {
			playerRank = player.rank || player.newPackageRank || player.packageRank || null;
		}

		if (playerRank === "MVP_PLUS" && player.monthlyPackageRank === "SUPERSTAR") {
			playerRank = "MVP_PLUS_PLUS";
		}

		if (player.rank === "NONE") {
			playerRank = null;
		}
		return playerRank;
	},

	//probs doesnt work lol, havent tested
	/**
	 * Gets the message by id
	 * @param {Discord.Client} discordClient Discord client
	 * @param {Discord.Channel|Number|String} channel Channel to retrieve message ID from (ID or object)
	 * @param {Number|String} messageId Message ID
	 * @returns {Discord.Message} Message with the id
	 */
	getMessageById: function (discordClient, channel, messageId) {
		if (channel instanceof Discord.Channel) {
			return channel.messages.fetch(messageId).then((msg) => {
				return msg;
			});
		} else {
			return this.getChannelById(discordClient, messageId)
				.messages.fetch(messageId)
				.then((msg) => {
					return msg;
				});
		}
	},

	/**
	 * Gets the channel by id
	 * @param {Discord.Client} discordClient Discord client
	 * @param {Number|String} id Channel ID
	 * @returns {Discord.TextChannel} Channel with the id
	 */
	getChannelById: function (discordClient, id) {
		return discordClient.channels.cache.get(id);
	},

	//todo- redo this lol, the format desc is a mess
	/**
	 * Formats `time` to `DD:HH:MM`|`MM:SS`
	 * @param {String|Number} time Time in minutes|seconds
	 * @param {"m"|"s"} [format=m] Whether to parse from minutes or seconds
	 * @returns {String} `time` formatted as `DD:HH:MM`|`MM:SS`
	 */
	formatTime: function (time, format) {
		if (!format || format == "m") {
			var days = Math.floor(time / 24 / 60) + "";
			var hours = Math.floor((time / 60) % 24) + "";
			var minutes = Math.floor(time % 60) + "";

			if (days.length == 1) days = "0" + days;
			if (hours.length == 1) hours = "0" + hours;
			if (minutes.length == 1) minutes = "0" + minutes;

			return days + ":" + hours + ":" + minutes;
		} else if (format == "s") {
			return ((time - (time %= 60)) / 60).toFixed(0) + (9 < time.toFixed(0) ? ":" : ":0") + time.toFixed(0);
		}
	},

	/**
	 * Sets the author for the embed based on the message's author.
	 * @param {Discord.Message} message
	 * @param {Discord.MessageEmbed} embed
	 * @returns {Discord.MessageEmbed} The embed with the author set to the message author
	 */
	getAuthor: function (message, embed) {
		return embed.setAuthor(message.author.username, message.author.avatarURL());
	},

	/**
	 * Sorts a map ascending or descending by its keys or values
	 * @param {Map} map
	 * @param {"keys"|"values"} item
	 * @param {"asc"|"desc"} method
	 * @returns {Map} Sorted map
	 */
	sortMap: function (map, item, method) {
		if (item == "keys") {
			if (method == "asc") {
				return new Map([...map.entries()].sort());
			} else if (method == "desc") {
				return new Map([...map.entries()].sort().reverse());
			}
		} else if (item == "values") {
			if (method == "asc") {
				return new Map([...map.entries()].sort((a, b) => a[1] - b[1]));
			} else if (method == "desc") {
				return new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
			}
		}
		return null;
	}
};
