const Discord = require("discord.js");
const { guildBase } = require("../../mongoUtil");
const mongoUtil = require("../../mongoUtil");

/**
 * @param {Discord.Client} discordClient
 * @param {Client} hypixelClient
 * @param {Discord.Guild} guild
 */
module.exports = async (discordClient, hypixelClient, guild) => {
	console.log("Joined Guild " + guild.id);
	if (!discordClient.guildSettings.has(guild.id)) {
		const fetchedGuildSettings = await mongoUtil.guildSettings(guild.id);
		if (!fetchedGuildSettings) {
			var guildSettings = guildBase;
			guildSettings.guild_id = guild.id;

			discordClient.guildSettings.set(guild.id, guildSettings);
			mongoUtil.insertGuild(guildSettings);
		}
	}
};
