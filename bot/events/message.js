const config = require("../../config.json");
const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const mongoUtil = require("../../mongoUtil");
const utils = require("../utils");

/**
 * @param {Discord.Client} discordClient
 * @param {Client} hypixelClient
 * @param {Discord.Message} message
 */
module.exports = async (discordClient, hypixelClient, message) => {
	if (message.author.bot) return;
	if (!message.content.startsWith(discordClient.prefix)) return;
	const args = message.content.slice(discordClient.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	const cmd = discordClient.commands.get(command);
	if (!cmd) return;

	var guildId = message.guild.id;
	var senderId = message.author.id;
	var guildOwner = message.guild.ownerID;

	if (cmd.admin && !config.admins.includes(senderId)) return;

	var guild_settings;

	if (!discordClient.guildSettings.has(guildId)) {
		var guildSettings = await mongoUtil.guildSettings(guildId, discordClient);

		if (guildSettings) {
			guild_settings = guildSettings.settings;
		} else {
			var obj = {
				guild_id: guildId,
				owner_id: guildOwner,
				settings: {
					logs_channel: "",
					enable_logs: false,
					command_channels: [],
					disable_commands: [],
					limit_command_channels: false,
					moderators: [],
					moderator_commands: ["snipe", "quote"]
				}
			};
			guild_settings = obj.settings;
			discordClient.guildSettings.set(guildId, obj);
			mongoUtil.insertGuild(obj);
		}
	} else {
		guild_settings = discordClient.guildSettings.get(guildId).settings;
	}

	var guildModerators = guild_settings.moderators;
	var guildModeratorCommands = guild_settings.moderator_commands;
	var guildDisabledCommands = guild_settings.disabled_commands;
	var guildCommandChannels = guild_settings.command_channels;
	var isSenderAdmin = message.member.hasPermission("ADMINISTRATOR");

	if (!isSenderAdmin) {
		if (guildOwner != senderId) {
			if (!guildModerators.includes(senderId)) {
				if (guildModeratorCommands.includes(cmd)) {
					return message.reply(utils.getErrorEmbed("You cannot use this command"));
				} else if (guildDisabledCommands.includes(cmd)) {
					return message.reply(utils.getErrorEmbed("This command is disabled in this guild"));
				}
			}
		}
	}

	if (!isSenderAdmin) {
		if (guildOwner != senderId) {
			if (!guildModerators.includes(senderId)) {
				if (!guildCommandChannels.includes(message.channel.id)) {
					return message.reply(utils.getErrorEmbed("Commands are disabled in this channel"));
				}
			}
		}
	}

	if (!discordClient.cooldowns.has(command)) {
		discordClient.cooldowns.set(command, new Discord.Collection());
	}

	if (!config.admins.includes(senderId)) {
		const now = Date.now();
		const timestamps = discordClient.cooldowns.get(command);
		const cooldownAmount = (cmd.cooldown || 5) * 1000;

		if (timestamps.has(senderId)) {
			const expirationTime = timestamps.get(senderId) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command}\` command.`);
			}
		}

		timestamps.set(senderId, now);
		setTimeout(() => timestamps.delete(senderId), cooldownAmount);
	}

	cmd.run(discordClient, hypixelClient, message, args);
};
