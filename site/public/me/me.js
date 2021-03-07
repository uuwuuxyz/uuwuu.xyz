require("dotenv").config();
const express = require("express");
const router = express.Router();
const path = require("path");
const mongoUtil = require("../../../mongoUtil");
const logging = require("../../logging");
const ratelimiter = require("../../ratelimiter");
const utils = require("../../utils");

router.get("/", async (req, res) => {
	if (req.session.discord_token && req.session.discord_id) {
		var discordUser = await utils.getDiscordUser(req.session.discord_token);
		if (discordUser.id == req.session.discord_id) {
			var guilds = await utils.getUsersGuilds(req.session.discord_token);
			guilds = guilds.filter((a) => a.owner || a.permissions == 8);

			req.session.discord_guilds = guilds;

			var guildSettings;

			if (guilds.length > 0) {
				guildSettings = await mongoUtil.getGuilds(guilds.map((a) => a.id));
				req.session.discord_guild_settings = guildSettings;
			}

			if (req.session.linked_anilist_username || req.session.linked_osu_id || req.session.linked_osu_username || req.session.linked_minecraft_uuid) {
			} else {
				var userSettings = await mongoUtil.userSettings(discordUser.id);
				req.session.linked_anilist_username = userSettings.anilist_username;
				req.session.linked_osu_id = userSettings.osu_id;
				req.session.linked_osu_username = userSettings.osu_username;
				req.session.linked_minecraft_uuid = userSettings.minecraft_uuid;
			}

			res.status(200).render(path.join(__dirname, "me.ejs"), {
				linked_anilist_username: req.session.linked_anilist_username,
				linked_osu_id: req.session.linked_osu_id,
				linked_osu_username: req.session.linked_osu_username,
				linked_minecraft_uuid: req.session.linked_minecraft_uuid,
				discord_guilds: guilds,
				discord_guild_settings: guildSettings
			});
		} else {
			res.status(401).render(path.join(__dirname, "notloggedin.ejs"));
		}
	} else {
		res.status(401).render(path.join(__dirname, "notloggedin.ejs"));
	}
});

router.get("/guilds", async (req, res) => {
	if (req.session.discord_token && req.session.discord_id && req.session.discord_guilds) {
		res.status(200).render(path.join(__dirname, "guilds.ejs"), {
			discord_guilds: req.session.discord_guilds,
			discord_guild_settings: req.session.discord_guild_settings
		});
	} else {
		res.status(401).render(path.join(__dirname, "notloggedin.ejs"));
	}
});

module.exports = router;
