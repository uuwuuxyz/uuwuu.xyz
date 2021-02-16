const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");

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
		var embed = discordClient.snipe.get(message.guild.id)[message.channel.id];
		if (embed) message.reply({ embed });
	}
};
