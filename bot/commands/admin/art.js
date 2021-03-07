const config = require("../../../config.json");
const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const utils = require("../../utils");
const { default: axios } = require("axios");

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
		/*
            >art 	fate    ,    astolfo    ,     nsfw?
                    ^^ series    ^^ character     ^^ nsfw
        */
		// Currently NSFW not supported due to vague TOS on my VPS' host's side.

		var arguments = args.join(" ").split(",");

		arguments = arguments.map(function (el) {
			return el.trim();
		});

		if (arguments[0] === "--refresh") {
			if (config.admins.includes(message.author.id)) {
				axios.get("https://art.uuwuu.xyz/ws.php?format=json&method=pwg.categories.getList&recursive=true").then((response) => {
					discordClient.artCache = new Discord.Collection();
					discordClient.artCache.set("categories", response.data.result.categories);
				});
				return message.reply("Reloaded art cache");
			}
		}

		if (!arguments[0]) return utils.getErrorEmbed("Please include a series name! Refer to `help art` for command syntax.");
		if (!arguments[1]) return utils.getErrorEmbed("Please include a character name! Refer to `help art` for command syntax.");

		var seriesName = arguments[0].toLowerCase();
		var characterName = arguments[1].toLowerCase();
		var nsfw = arguments[2];

		var categories = discordClient.artCache.get("categories");

		if (!categories) {
			// ran cmd before bot started fully
			await axios.get("https://art.uuwuu.xyz/ws.php?format=json&method=pwg.categories.getList&recursive=true").then((response) => {
				categories = response.data.result.categories;
				discordClient.artCache.set("categories", categories);
			});
		}

		if (nsfw) nsfw = ["true", "nsfw", "yes", "y"].includes(nsfw.toLowerCase());

		if (nsfw) return message.reply(utils.getErrorEmbed("Currently NSFW images are not stored due to shitty vague TOS"));

		var seriesAlbum = categories.filter((x) => x.name.toLowerCase() === seriesName);

		if (seriesAlbum.length == 0)
			return message.reply(utils.getErrorEmbed("Cannot find series. Please go to https://art.uuwuu.xyz to find available series."));

		var seriesAlbumId = seriesAlbum[0].id;

		if (!seriesAlbumId) message.reply(utils.getErrorEmbed("Cannot find series. Please go to https://art.uuwuu.xyz to find available series."));

		var characterAlbum = categories.filter((x) => x.name.toLowerCase() === characterName && Number(x.id_uppercat) === seriesAlbumId);

		if (characterAlbum.length == 0)
			return message.reply(utils.getErrorEmbed("Cannot find character. Please go to https://art.uuwuu.xyz to find available series."));

		var characterAlbumId = characterAlbum[0].id;

		if (!characterAlbumId) return message.reply(utils.getErrorEmbed("Cannot find character. Please go to https://art.uuwuu.xyz to find available series."));

		var imagesAlbumId;

		if (nsfw == null) {
			if (!message.channel.nsfw) {
				nsfw = false;
			} else {
				nsfw = Math.floor(Math.random() * 2) + 1 == 1;
			}
		}

		if (nsfw) {
			if (!message.channel.nsfw) return message.channel.send("This channel is not NSFW, will not send.");
			imagesAlbumId = categories.find((x) => x.name == "NSFW" && Number(x.id_uppercat) === characterAlbumId).id;
		} else {
			imagesAlbumId = categories.find((x) => x.name == "SFW" && Number(x.id_uppercat) === characterAlbumId).id;
		}

		var images;

		if (discordClient.artCache.has(imagesAlbumId)) {
			images = discordClient.artCache.get(imagesAlbumId);
		} else {
			var response = await axios.get("https://art.uuwuu.xyz/ws.php?method=pwg.categories.getImages&format=json&cat_id=" + imagesAlbumId);
			images = response.data.result.images;
			discordClient.artCache.set(imagesAlbumId, images);
		}

		var item = images[Math.floor(Math.random() * images.length)];

		var embed = new Discord.MessageEmbed();
		embed.setImage(item.derivatives.xxlarge.url);

		message.reply({ embed });
	}
};
