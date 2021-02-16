const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const request = require("request");
const fs = require("fs");
const metaget = require("metaget");
const Jimp = require("jimp");
const utils = require("../../../utils");

/**
 * @param {Discord.Client} discordClient
 * @param {Client} hypixelClient
 * @param {Discord.Message} message
 * @param {String[]} args
 */

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
		// Not working ;/
		return message.reply(utils.getErrorEmbed("Currently this command is not working"));

		var url;
		var filename;
		var text;

		try {
			if (message.attachments.size > 0) {
				url = message.attachments.first().url;
				filename = message.attachments.first().name;
				text = message.content.substring((discordClient.prefix + "text ").length).toUpperCase();
			} else {
				url = message.content.substring((discordClient.prefix + "text ").length).trim();
				filename = url.split("#").shift().split("?").shift().split("/").pop();
			}

			if (url == "" || !(url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg"))) {
				var res = await metaget.fetch(url);
				if (!res["og:image"] || !(res["og:image"].endsWith(".png") || res["og:image"].endsWith(".jpg") || res["og:image"].endsWith(".jpeg"))) {
					return message.reply(utils.getErrorEmbed("Please attach an image"));
				} else {
					url = res["og:image"];
					filename = url.split("#").shift().split("?").shift().split("/").pop();
				}
			}

			var extension = "." + /(?:\.([^.]+))?$/.exec(filename)[1];
			var path = "./data/downloads/attachments/" + message.id + extension;

			download(url, path, () => {
				Jimp.read(path).then((image) => {
					Jimp.loadFont("./data/impact_0_font.fnt").then((font) => {
						if (!text) {
							var embed = new Discord.MessageEmbed();
							embed.setTitle("What text do you want to add?");
							embed.setColor(16753920);
							message.reply({ embed }).then(() => {
								let filter = (m) => m.author.id === message.author.id;
								message.channel
									.awaitMessages(filter, {
										max: 1,
										time: 30000,
										errors: ["time"]
									})
									.then((msg) => {
										text = msg.first().content.toUpperCase();
										console.log(text);
										image.print(font, 0, 0, {
											text: text,
											alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
										});
										image.write(path + "_out" + extension);

										var embed = new Discord.MessageEmbed();
										embed = utils.getAuthor(message, embed);
										var attachment = new Discord.MessageAttachment(path + "_out" + extension, "out.png");
										embed.attachFiles(attachment);
										embed.setImage("attachment://out.png");

										msg.first()
											.reply({ embed })
											.then((msg_) => {
												try {
													fs.unlinkSync(path);
													fs.unlinkSync(path + "_out" + extension);
												} catch (err) {
													console.error(err);
												}
											});
									});
							});
						} else {
							console.log(text);
							image.print(font, 0, 0, {
								text: text,
								alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
							});
							image.write(path + "_out" + extension);
							var embed = new Discord.MessageEmbed();
							embed = utils.getAuthor(message, embed);
							var attachment = new Discord.MessageAttachment(path + "_out" + extension, "out.png");
							embed.attachFiles(attachment);
							embed.setImage("attachment://out.png");
							/*
							{
									files: [path + "_out" + extension],
								}*/
							message.reply({ embed }).then((msg) => {
								try {
									fs.unlinkSync(path);
									fs.unlinkSync(path + "_out" + extension);
								} catch (err) {
									console.error(err);
								}
							});
						}
					});
				});
			});
		} catch (e) {
			message.reply(utils.getErrorEmbed("Something went wrong downloading or modifying the image"));
		}
	}
};

const download = (url, path, callback) => {
	request.head(url, (err, res, body) => {
		request(url).pipe(fs.createWriteStream(path)).on("close", callback);
	});
};
