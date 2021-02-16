const Discord = require("discord.js");
const mongoUtil = require("../../mongoUtil");

/**
 * @param {Discord.Client} discordClient
 * @param {Discord.Guild} guild
 */
module.exports = (discordClient, guild) => {
	if (!discordClient.guildSettings.has(guild.id)) {
		// this will return true if the bot left and joined the guild in the same session
		mongoUtil.guildSettings(guild.id, discordClient).then((guildSettings) => {
			// this will return a guildSettings object if the bot was kicked when it was offline or in a different session, and already has settings defined
			if (!guildSettings) {
				var guildSettings = {
					//default settings
					guild_id: guild.id,
					owner_id: guild.ownerID,
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

				discordClient.guildSettings.set(guild.id, guildSettings);
				mongoUtil.insertGuild(guildSettings);
			}
		});
	}
};
