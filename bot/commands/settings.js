const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const utils = require("../utils");
const mongoUtil = require("../../mongoUtil");
const options = ["true", "false", "t", "f", "on", "off"];

module.exports = {
	cooldown: 20,
	admin: false,
	/**
	 * @param {Discord.Client} discordClient
	 * @param {Client} hypixelClient
	 * @param {Discord.Message} message
	 * @param {String[]} args
	 */
	async run(discordClient, hypixelClient, message, args) {
		var id;
		var userSettings;

		if (message.mentions.users.size > 0) {
			id = message.mentions.users.first().id;
			userSettings = await mongoUtil.userSettings(id, discordClient);
		} else {
			id = message.author.id;
			userSettings = await mongoUtil.userSettings(id, discordClient);
		}

		if (!userSettings) {
			await mongoUtil.insertUser(mongoUtil.userBase);
			userSettings = mongoUtil.userBase;
			userSettings.discord_id = id;
		}

		discordClient.userSettings.set(id, userSettings);

		if (message.mentions.users.size == 0 && args.length > 0) {
			var arg = args[0].toLowerCase();
			var toggle = true;
			var msg;
			var bool = false;
			if (args.length > 1) {
				bool = getBool(args[1]);
				toggle = !options.includes(args[1]);
			}

			var alreadyTrueEmbed = utils.getErrorEmbed("This setting is already set to true");
			var alreadyFalseEmbed = utils.getErrorEmbed("This setting is already set to false");

			if (arg == "showanilist") {
				if (toggle) {
					userSettings.settings.privacy.show_anilist = !userSettings.settings.privacy.show_anilist;
					msg = (userSettings.settings.privacy.show_anilist ? "Enabled" : "Disabled") + " anilist mention discoverability";
				} else {
					if (userSettings.settings.privacy.show_anilist == bool) return message.reply(bool ? alreadyTrueEmbed : alreadyFalseEmbed);
					userSettings.settings.privacy.show_anilist = bool;
					msg = (userSettings.settings.privacy.show_anilist ? "Enabled" : "Disabled") + " anilist mention discoverability";
				}
			} else if (arg == "showosu") {
				if (toggle) {
					userSettings.settings.privacy.show_osu = !userSettings.settings.privacy.show_osu;
					msg = (userSettings.settings.privacy.show_osu ? "Enabled" : "Disabled") + " osu mention discoverability";
				} else {
					if (userSettings.settings.privacy.show_osu == bool) return message.reply(bool ? alreadyTrueEmbed : alreadyFalseEmbed);
					userSettings.settings.privacy.show_osu = bool;
					msg = (userSettings.settings.privacy.show_osu ? "Enabled" : "Disabled") + " osu mention discoverability";
				}
			} else if (arg == "showminecraft") {
				if (toggle) {
					userSettings.settings.privacy.show_minecraft = !userSettings.settings.privacy.show_minecraft;
					msg = (userSettings.settings.privacy.show_minecraft ? "Enabled" : "Disabled") + " minecraft mention discoverability";
				} else {
					if (userSettings.settings.privacy.show_minecraft == bool) return message.reply(bool ? alreadyTrueEmbed : alreadyFalseEmbed);
					userSettings.settings.privacy.show_minecraft = bool;
					msg = (userSettings.settings.privacy.show_minecraft ? "Enabled" : "Disabled") + " minecraft mention discoverability";
				}
			} else {
				return message.reply(utils.getErrorEmbed("Invalid setting"));
			}

			await mongoUtil.updateUser(id, userSettings);
			discordClient.userSettings.set(id, userSettings);

			var embed = new Discord.MessageEmbed();
			embed.setTitle(msg);
			message.reply(embed);
		} else {
			var embed = new Discord.MessageEmbed();
			embed.setDescription("Options: `showanilist|showosu|showminecraft`");
			embed.setTitle("Your privacy settings");
			embed.addField("Anilist mention discoverability", userSettings.settings.privacy.show_anilist);
			embed.addField("osu! mention discoverability", userSettings.settings.privacy.show_osu);
			embed.addField("Minecraft mention discoverability", userSettings.settings.privacy.show_minecraft);
			embed.setFooter("These allow people to mention you and view your linked accounts");
			return message.reply(embed);
		}
	}
};

function getBool(string) {
	return string == "true" || string == "t" || string == "on";
}
