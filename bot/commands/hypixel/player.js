const Discord = require("discord.js");
const { Client } = require("hypixel-api-reborn");
const utils = require("../../utils");
const { default: axios } = require("axios");
const mongoUtil = require("../../../mongoUtil");
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
		var uuid;
		var discordId;

		if (args.length == 0) {
			discordId = message.author.id;
		} else if (message.mentions.users.size > 0) {
			discordId = message.mentions.users.first().id;
		}

		if (!discordId) {
			const username = args[0];

			if (username.length > 16) {
				uuid = username;
			} else {
				var response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
				uuid = response.id;
			}
		} else {
			var userSettings = await mongoUtil.userSettings(discordId, discordClient);
			if (!userSettings || !userSettings.minecraft_uuid) {
				return message.reply(utils.getErrorEmbed("This user does not have an minecraft account linked"));
			}
			if (discordId != message.author.id) {
				if (!userSettings.settings.privacy.show_minecraft) {
					return message.reply(utils.getErrorEmbed("This user has their minecraft account hidden!"));
				}
			}

			uuid = userSettings.minecraft_uuid;
		}

		if (!uuid) return message.reply(utils.getErrorEmbed("Cannot get player!"));

		try {
			const player = await hypixelClient.getPlayer(uuid);
			if (player) {
				var playerEmbed = new Discord.MessageEmbed();

				const username = player.nickname;
				const rank = player.rank;
				const networkLevel = player.level;
				const achievementPoints = player.achievementPoints;
				const firstLogin = player.firstLogin;
				const lastLogin = player.lastLogin;
				const guild = player.guild;
				const karma = player.karma;

				playerEmbed.setTitle(`[${rank}] ${username} ${guild ? "[" + guild.tag + "]" : ""}`);
				playerEmbed.addField("Guild", guild ? guild.name : "None");
				playerEmbed.addField("Level", networkLevel, false);
				playerEmbed.addField("Achievement Points", achievementPoints, false);
				playerEmbed.addField("Karma", karma, false);
				playerEmbed.addField("First Login", firstLogin.toUTCString(), false);
				playerEmbed.addField("Last Login", lastLogin.toUTCString(), false);

				return message.reply(playerEmbed);
			} else {
				return message.reply(utils.getErrorEmbed("Cannot find player!"));
			}
		} catch (e) {
			if (!uuid) return message.reply(utils.getErrorEmbed("Cannot get player!"));
		}
	}
};
