const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const commands = require("../../site/public/commands.json");
const utils = require("../utils");

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
		if (args.length > 0) {
			var allCommands = [];

			if (!/[A-z]/.test(args[0])) return utils.getErrorEmbed("Please limit command names to A-z");

			Object.keys(commands.groups).forEach((key) => {
				for (var i = 0; i < commands.groups[key].length; i++) {
					allCommands.push(commands.groups[key][i]);
				}
			});

			var filteredCommands = allCommands.filter((c) => c.name.startsWith(args[0].toLowerCase()));

			var embed = new Discord.MessageEmbed();
			embed.setTitle("Search results for " + args[0].toLowerCase());

			if (filteredCommands.length == 0) {
				embed.setDescription("No commands found");
			} else {
				for (i = 0; i < filteredCommands.length; i++) {
					var cmd = filteredCommands[i];
					embed.addField(cmd.name, `Group: ${cmd.group} | ${cmd.arguments ? "`" + cmd.arguments + "`" : ""} | ${cmd.description}`);
				}
			}

			message.reply({ embed });
		} else {
			var embeds = [];
			Object.keys(commands.groups).forEach((key) => {
				var embed = new Discord.MessageEmbed();
				embed.setTitle(key.charAt(0).toUpperCase() + key.slice(1));
				for (var i = 0; i < commands.groups[key].length; i++) {
					var cmd = commands.groups[key][i];
					embed.addField(cmd.name, `${cmd.arguments ? "`" + cmd.arguments + "`" : ""} | ${cmd.description}`);
				}
				embeds.push(embed);
			});

			message.reply(embeds[0]).then((msg) => {
				pageHandler(message.author, msg, embeds, 0, true);
			});
		}
	}
};

/**
 *
 * @param {Discord.Client} discordClient
 * @param {Discord.User} allowedRespondent
 * @param {Discord.Message} message
 * @param {Discord.MessageEmbed[]} pages
 * @param {Number} page
 * @param {Boolean} addReactions
 */
async function pageHandler(allowedRespondent, message, pages, page, addReactions) {
	if (addReactions) message.react("◀");
	if (addReactions) message.react("▶");

	const filter = (reaction, user) => {
		return ["◀", "▶"].includes(reaction.emoji.name) && user.id === allowedRespondent.id;
	};

	message
		.awaitReactions(filter, {
			max: 1,
			time: 30000,
			errors: ["time"]
		})
		.then((collected) => {
			const reaction = collected.first();
			message.reactions.resolve(reaction.emoji.name).users.remove(allowedRespondent.id);

			if (reaction.emoji.name === "◀") {
				if (page - 1 == -1) {
					pageHandler(allowedRespondent, message, pages, page, false);
					return;
				}

				message.edit(pages[page - 1]);
				pageHandler(allowedRespondent, message, pages, page - 1, false);
			} else {
				if (page + 1 == pages.length) {
					pageHandler(allowedRespondent, message, pages, page, false);
					return;
				}

				message.edit(pages[page + 1]);
				pageHandler(allowedRespondent, message, pages, page + 1, false);
			}
		})
		.catch((collected) => {
			if (collected.first()) message.reactions.resolve(collected.first().emoji.name).remove();
			pageHandler(allowedRespondent, message, pages, page, false);
		});
}
