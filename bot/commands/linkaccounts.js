const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const mongoUtil = require("../../mongoUtil");

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
		var userSettings = await mongoUtil.userSettings(message.author.id);
		var embed = new Discord.MessageEmbed();
		embed.setTitle("Linked Accounts");
		embed.setColor(32768);
		embed.setURL("https://uuwuu.xyz");

		var anilist = userSettings.anilist_username ? "https://anilist.co/user/" + userSettings.anilist_username : "None";
		var osu = userSettings.osu_id ? "https://osu.ppy.sh/users/" + userSettings.osu_id : "None";
		var minecraft = userSettings.minecraft_uuid ? "https://namemc.com/search?q=" + userSettings.minecraft_uuid : "None";

		embed.addField("Anilist", anilist);
		embed.addField("osu!", osu);
		embed.addField("Minecraft", minecraft);

		embed.setFooter("Link your accounts at https://uuwuu.xyz");

		if (!userSettings) {
			var user = mongoUtil.userBase;
			user.discord_id = message.author.id;
			mongoUtil.insertUser(user);
			discordClient.userSettings.set(message.author.id, user);
		} else {
			discordClient.userSettings.set(message.author.id, userSettings);
		}

		message.reply({ embed });
	}
};
