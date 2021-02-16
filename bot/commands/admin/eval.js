const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");

module.exports = {
	cooldown: 0,
	admin: true,
	/**
	 * @param {Discord.Client} discordClient
	 * @param {Client} hypixelClient
	 * @param {Discord.Message} message
	 * @param {String[]} args
	 */
	async run(discordClient, hypixelClient, message, args) {
		try {
			var code = message.content.substring((discordClient.prefix + "eval ").length);
			if (code.startsWith("```")) {
				code = code.slice(3, -3);
			} else if (code.startsWith("`")) {
				code = code.slice(1, -1);
			}

			var noReturn = false;
			if (code.startsWith("noreturn")) {
				code = code.substring(8);
				noReturn = true;
			}

			code =
				`function random(min, max) {return Math.floor((Math.random() * max) + min);} function fetchMessages(max) {return message.channel.messages.fetch({limit: max})}` +
				code;

			let evaled = eval(code);

			if (!noReturn) {
				if (args.length > 0 && args[0] == "true") {
					message.channel.messages
						.fetch({
							limit: 50
						})
						.then((messages) => {
							var selfMessages = messages.filter((msg) => msg.author.id == discordClient.user.id);
							var msgs = Array.from(selfMessages.values());
							var sent = false;
							msgs.forEach((msg) => {
								if (!sent) {
									if (msg.editedTimestamp > message.editedTimestamp || msg.createdTimestamp > message.createdTimestamp) {
										msg.edit(clean(evaled), {
											code: "xl"
										}).catch((err) => {
											message.reply(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
										});
									}
								}
							});
						});
				} else {
					message.channel
						.send(clean(evaled), {
							code: "xl"
						})
						.catch((err) => {
							message.reply(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
						});
				}
			}
		} catch (err) {
			message.reply(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
		}
	}
};

function clean(text) {
	if (typeof text === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
	else return text;
}
