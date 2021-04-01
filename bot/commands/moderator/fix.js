const Discord = require("discord.js");
const { Client } = require("hypixel-api-reborn");
require("../../ExtendedMessage");

module.exports = {
	cooldown: 5,
	admin: false,
	/**
	 * @param {Discord.Client} discordClient
	 * @param {Client} hypixelClient
	 * @param {Discord.Message} message
	 * @param {String[]} args
	 */
	async run(discordClient, hypixelClient, message, args) {
		message.delete();
		message.channel.stopTyping();
	}
};
