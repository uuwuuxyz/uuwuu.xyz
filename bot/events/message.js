const config = require("../../config.json");
const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
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
	const senderId = message.author.id;

	if (cmd.admin && !config.admins.includes(senderId)) return;

	const guildSettings = discordClient.guildSettings.get(message.guild.id);

	if (!guildSettings)
		return message.reply("Something went *extremely* wrong. Contact `Regex#1028` immediately. Give me 12 hours to respond cause timezones.");

	if (guildSettings.settings.disabled_commands) if (guildSettings.settings.disabled_commands.includes(command)) return;

	const guildCommandChannels = guildSettings.settings.command_channels;
	const guildModeratorCommands = guildSettings.settings.moderator_commands;

	if (!message.member.hasPermission("ADMINISTRATOR")) {
		const guildModerators = guildSettings.settings.moderators;
		if (guildModeratorCommands) {
			if (guildModeratorCommands.includes(command)) {
				if (!guildModerators.includes(senderId)) return utils.getErrorEmbed("You cannot use this command!");
			}
		}

		if (!guildModerators.includes(senderId)) {
			if (guildSettings.settings.limit_command_channels && !guildCommandChannels.includes(message.channel.id)) return;
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

	message.channel.startTyping();
	cmd.run(discordClient, hypixelClient, message, args);
};
