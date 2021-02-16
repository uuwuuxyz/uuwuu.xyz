const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const utils = require("../../utils");

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
		var content = message.content.substring((discordClient.prefix + "quote ").length);

		/**
		 * @see https://github.com/FireDiscordBot/bot/blob/master/lib/util/constants.ts
		 */
		var url = /<?(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/(?<guild_id>\d{15,21})\/(?<channel_id>\d{15,21})\/(?<message_id>\d{15,21})>?/gim.exec(
			content
		);

		var guild_id = url[1];
		var channel_id = url[2];
		var message_id = url[3];

		var guilds = discordClient.guilds.cache.map((guild) => guild.id);
		if (!guilds.includes(guild_id)) {
			try {
				await discordClient.guilds.fetch(guild_id); // checks if the bot is in the guild but the guild isn't cached
			} catch (e) {
				return message.reply(utils.getErrorEmbed("Not in that guild"));
			}
		}

		var channel;

		message.delete();

		if (guild_id && channel_id && message_id) {
			if (channel_id === message.channel.id) {
				channel = message.channel;
			} else {
				channel = await discordClient.channels.fetch(channel_id);
			}

			channel.messages
				.fetch({
					limit: 1,
					around: message_id
				})
				.then((messages) => {
					msg = messages.first();
					var embed = new Discord.MessageEmbed();
					embed = utils.getAuthor(msg, embed);
					if (msg.content) {
						embed.setDescription(msg.content);
					} else {
						if (msg.attachments.size > 0) {
							embed.setDescription("Attachment");
						} else {
							return;
						}
					}

					embed.setFooter(url[0]);
					message.reply({ embed });
				});
		}
	}
};
