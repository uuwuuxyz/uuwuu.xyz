const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const mongoUtil = require("../../mongoUtil");
const { diff } = require("jimp");
const { guildBase } = require("../../mongoUtil");

/**
 * @param {Discord.Client} discordClient
 * @param {Client} hypixelClient
 * @param {Discord.Message} message
 */
module.exports = async (discordClient, hypixelClient, message) => {
	console.log("Logged in as " + discordClient.user.username);

	// see https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
	// using Difference; let arr1 be discordGuilds. let arr2 be mongoGuildIDs

	// the bot will always be in more or equal to the guilds of mongoGuildIDs unless guild left,
	// which does not matter as no events will be receieved from them.

	var discordGuilds = discordClient.guilds.cache.map((guild) => guild.id);
	var mongoGuilds = await mongoUtil.getGuilds(discordGuilds);

	var mongoGuildIDs = mongoGuilds.map((a) => a.guild_id);

	mongoGuilds.forEach((guild) => {
		discordClient.guildSettings.set(guild.guild_id, guild);
	});

	let difference = discordGuilds.filter((x) => !mongoGuildIDs.includes(x));

	if (difference.length > 0) {
		mongoUtil.insertGuilds(
			difference.map((a) => {
				return { ...guildBase, guild_id: a };
			})
		);
		difference.forEach((guildId) => {
			var gSettings = guildBase;
			gSettings.guild_id = guildId;
			discordClient.guildSettings.set(guildId, gSettings);
		});
	}

	discordClient.user.setActivity("uuwuu.xyz | " + discordClient.prefix + "help");
};
