const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const { Uwuifier } = require("uwuifier");
const utils = require("../utils");

const uwuifier = new Uwuifier({
	spaces: {
		faces: 0.3,
		actions: 0.075,
		stutters: 0.075
	},
	words: 1,
	exclamations: 1
});

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
		if (args.length == 0) return message.reply("Please include a sentence to uwuify");
		var sentence = message.content.substring((discordClient.prefix + "uwu ").length);
		var embed = new Discord.MessageEmbed();
		embed.setDescription(uwuifier.uwuifySentence(sentence));
		embed = utils.getAuthor(message, embed);
		message.reply({ embed });
	}
};
