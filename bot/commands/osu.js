const config = require("../../config.json");
const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const utils = require("../utils");
const mongoUtil = require("../../mongoUtil");
const fetch = require("node-fetch");

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
		var id;
		var username;

		if (message.mentions.users.size > 0) {
			id = message.mentions.users.first().id;
		} else if (args.length == 0) {
			id = message.author.id;
		}

		if (id) {
			var userSettings = await mongoUtil.userSettings(id, discordClient);

			if (!userSettings || !userSettings.osu_username) {
				return message.reply(utils.getErrorEmbed("This user does not have an osu account linked"));
			}

			if (!userSettings.settings.privacy.show_osu) {
				return message.reply(utils.getErrorEmbed("This user has their osu account hidden!"));
			}

			username = userSettings.osu_username;
		}

		if (args.length > 0 && message.mentions.users.size == 0) username = message.content.trim().substring((discordClient.prefix + "osu ").length);

		if (!username) return message.reply(utils.getErrorEmbed("Please include an osu username"));

		fetch(`https://osu.ppy.sh/api/get_user?u=${username}&k=${config.osu_api_key}`)
			.then((response) => response.json())
			.then((data) => {
				var user = data[0];
				var embed = new Discord.MessageEmbed();
				embed = utils.getAuthor(message, embed);
				embed.setTitle(user.username);
				embed.setURL(`https://osu.ppy.sh/users/${user.user_id}`);
				embed.setThumbnail(`http://s.ppy.sh/a/${user.user_id}`);
				embed.addField("PP", user.pp_raw, false);
				embed.addField("Global Ranking", `#${user.pp_rank}`, false);
				embed.addField("Country Ranking", `#${user.pp_country_rank}`, true);
				embed.addField("Time Played", `${user.total_seconds_played}`, false);
				message.reply({ embed });
			})
			.catch((err) => {
				message.reply(utils.getErrorEmbed("Something went wrong. Invalid user?"));
			});
	}
};
