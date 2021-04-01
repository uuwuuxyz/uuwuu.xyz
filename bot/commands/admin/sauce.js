const config = require("../../../config.json");
const Discord = require("discord.js");
const { Client } = require("hypixel-api-reborn");
const fetch = require("node-fetch");
const sagiri = require("sagiri");
const client = sagiri(config.saucenao_api_key);
const utils = require("../../utils");
require("../../ExtendedMessage");

module.exports = {
	cooldown: 20,
	admin: true,
	/**
	 * @param {Discord.Client} discordClient
	 * @param {Client} hypixelClient
	 * @param {Discord.Message} message
	 * @param {String[]} args
	 */
	async run(discordClient, hypixelClient, message, args) {
		var img = "";
		if (message.attachments.size > 0) {
			img = message.attachments.first().url;
			if (args.length > 0) {
				if (args[0] != "sauce") {
					findSauce(img, "trace")
						.then((result) => {
							var embed = getEmbed(result, "trace", message);
							message.reply({ embed });
						})
						.catch((error) => {
							message.reply(utils.getErrorEmbed("Sauce not found"));
						});
					return;
				}
			}

			//saucenao
			findSauce(img, "sauce")
				.then((result) => {
					var embed = getEmbed(result, "sauce", message);
					message.reply({ embed });
				})
				.catch((error) => {
					message.reply(utils.getErrorEmbed("Sauce not found. Try using `" + discordClient.prefix + "sauce trace` if it is a screenshot"));
				});
		} else {
			if (args.length > 0) {
				if (args[0] === "^") {
					message.channel.messages
						.fetch({
							limit: 5
						})
						.then((messages) => {
							var msgs = Array.from(messages.values());
							msgs.forEach((msg) => {
								if (msg.attachments.size > 0) {
									if (img == "") img = msg.attachments.first().url;
								}
							});

							if (img != "") {
								var trace = args.length > 1 && args[1] != "sauce";
								console.log(trace);
								findSauce(img, trace ? "trace" : "sauce")
									.then((result) => {
										var embed = getEmbed(result, trace ? "trace" : "sauce", message);
										message.reply({ embed });
									})
									.catch((error) => {
										message.reply(
											utils.getErrorEmbed("Sauce not found. Try using `" + discordClient.prefix + "sauce trace` if it is a screenshot")
										);
									});
							}
						})
						.catch(console.error);
				}
			}
		}
	}
};

function findSauce(img, method) {
	if (method == "sauce") {
		return client(img).then((response) => {
			return response;
		});
	} else if (method == "trace") {
		return fetch(`https://trace.moe/api/search?url=${img}`)
			.then((response) => response.json())
			.then((data) => {
				return data;
			});
	}
	return null;
}

/**
 * @param {JSON} results
 * @param {"sauce"|"trace"|null} method
 * @param {Discord.Message} message
 */
function getEmbed(results, method, message) {
	var embed = new Discord.MessageEmbed();
	embed.setTitle("Results");
	embed = utils.getAuthor(message, embed);
	if (method === "trace" || method === "trace.moe" || method === "moe") {
		var res = results.docs;

		if (res.size == 0) return message.reply("Sauce not found");

		var thumb = `https://trace.moe/thumbnail.php?anilist_id=${res[0].anilist_id}&file=${encodeURIComponent(res[0].filename)}&t=${res[0].at}&token=${
			res[0].tokenthumb
		}`;
		embed.setImage(thumb);

		for (i = 1; i <= 3; i++) {
			var result = res[i - 1];
			embed.addField(
				result.title_english,
				`Episode: ${result.episode} | At: ${utils.formatTime(result.at, "s")} | Link: https://anilist.co/anime/${result.anilist_id}/`,
				false
			);
		}
	} else {
		if (results.size == 0) return message.reply("Nothing found! Try using `>sauce trace` if it's a screenshot");

		embed.setImage(results[0].url);

		for (i = 1; i <= 3; i++) {
			embed.addField(`#${i}`, `**URL**: ${results[i - 1].url}\n**Artist**: ${results[i - 1].authorUrl}`, false);
		}
	}

	return embed;
}
