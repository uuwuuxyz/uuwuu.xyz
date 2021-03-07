const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const utils = require("../../../utils");
const subcommands = [
	"addcommandchannel",
	"removecommandchannel",
	"restrictcommandchannels",
	"setlogschannel",
	"addmoderator",
	"removemoderator",
	"addmoderatoronlycommand",
	"removemoderatoronlycommand",
	"toggle"
];
const mongoUtil = require("../../../../mongoUtil");

module.exports = {
	cooldown: 3,
	admin: false,
	/**
	 * @param {Discord.Client} discordClient
	 * @param {Client} hypixelClient
	 * @param {Discord.Message} message
	 * @param {String[]} args
	 */
	async run(discordClient, hypixelClient, message, args) {
		var guildSettings = discordClient.guildSettings.get(message.guild.id);

		var isOwner = message.guild.ownerID == message.author.id;
		var moderators = guildSettings.moderators;

		if (!isOwner && !moderators.includes(message.author.id)) return message.reply(utils.getErrorEmbed("You cannot use this command"));

		if (args.length > 0) {
			var subCommand = args[0].toLowerCase();
			if (subcommands.includes(subCommand)) {
				if (subCommand == "addcommandchannel") {
				} else if (subCommand == "removecommandchannel") {
				} else if (subCommand == "setlogschannel") {
				} else if (isOwner) {
					if (args.length > 1) {
						var idToAdd;

						if (message.mentions.users.first()) {
							idToAdd = message.mentions.users.first().id;
						} else {
							idToAdd = args[1];

							if (/[0-9]+/.test(idToAdd)) return message.reply("Invalid ID or User");
							var user = await message.guild.members.fetch({
								user: idToAdd
							});
							if (!user) return message.reply("Invalid ID or User");
						}

						if (subCommand == "addmoderator") {
							mongoUtil;
						} else if (subCommand == "removemoderator") {
						}
					} else {
						return message.reply("Please tag a user or enter their ID to add as a moderator");
					}

					if (subCommand == "addmoderatoronlycommand") {
					} else if (subCommand == "removemoderatoronlycommand") {
					}
				} else if (subCommand == "restrictcommandchannels") {
				} else if (subCommand == "togglecommand") {
					if (args.length > 1) {
						var command = args[1].toLowerCase();

						if (command == "help" || command == "config") return message.reply("You cannot disable this command");

						if (discordClient.commands.has(command)) {
							// check if already in disabled commands list
							// if it is, remove it from that list and update the guild settings in both cache and here.
						} else {
							return message.reply("Cannot find command " + command);
						}
					} else {
						return message.reply(utils.getErrorEmbed("Invalid arguments"));
					}
				}
			} else {
				return message.reply(utils.getErrorEmbed("Invalid arguments"));
			}
		}
	}
};
