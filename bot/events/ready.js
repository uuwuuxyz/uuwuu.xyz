const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");

/**
 * @param {Discord.Client} discordClient
 * @param {Client} hypixelClient
 * @param {Discord.Message} message
 */
module.exports = (discordClient, hypixelClient, message) => {
	console.log("Logged in as " + discordClient.user.username);
	discordClient.user.setActivity("uuwuu.xyz | " + discordClient.prefix + "help");
};
