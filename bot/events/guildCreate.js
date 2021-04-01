const Discord = require("discord.js");
const { guildBase } = require("../../mongoUtil");
const mongoUtil = require("../../mongoUtil");
const message = require("./message");
const permissions = ["ADD_REACTIONS", "EMBED_LINKS", "MANAGE_MESSAGES", "READ_MESSAGE_HISTORY", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "VIEW_CHANNEL"];

/**
 * @param {Discord.Client} discordClient
 * @param {Client} hypixelClient
 * @param {Discord.Guild} guild
 */
module.exports = async (discordClient, hypixelClient, guild) => {
	console.log("Joined Guild " + guild.id);

	// // Haven't tested
	// const me = guild.me;
	// permissions.forEach((permission) => {
	// 	if (!me.hasPermission(permission)) {
	// 		guild.leave();
	// 	}
	// });

	guild.owner
		.send(
			"Thanks for inviting me to your guild! To configure settings, go to https://uuwuu.xyz and login with discord." +
				"\nFrom there, go to Account > Guilds, and select the guild you want to edit settings for."
		)
		.catch(() => console.log("Could not DM guild owner."));

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
