require("dotenv").config();
const express = require("express");
const router = express.Router();
const path = require("path");
const mongoUtil = require("../../../mongoUtil");
const logging = require("../../logging");
const utils = require("../../utils");

router.get("/", async (req, res) => {
	var showUpdatedSettingsMessage = req.session.SettingsUpdated;
	var showUpdatedGuildMessage = req.session.GuildUpdated;
	req.session.SettingsUpdated = false;
	req.session.GuildUpdated = false;
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

			if (showUpdatedSettingsMessage || !req.session.user_settings) {
				var userSettings = await mongoUtil.userSettings(discordUser.id);
				req.session.user_settings = userSettings;
			}

			res.status(200).render(path.join(__dirname, "me.ejs"), {
				user_settings: req.session.user_settings,
				discord_guilds: guilds,
				discord_guild_settings: guildSettings,
				settingsUpdated: showUpdatedSettingsMessage,
				guildsUpdated: showUpdatedGuildMessage
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

router.get("/settings", async (req, res) => {
	if (req.session.discord_token && req.session.discord_id && req.session.user_settings) {
		res.status(200).render(path.join(__dirname, "settings.ejs"), {
			user_settings: req.session.user_settings
		});
	} else {
		res.status(401).render(path.join(__dirname, "notloggedin.ejs"));
	}
});

router.post("/settings/update", async (req, res) => {
	if (req.session.discord_token && req.session.discord_id && req.session.user_settings) {
		var discordUser = await utils.getDiscordUser(req.session.discord_token);
		if (discordUser.id == req.session.discord_id) {
			var anilist_mention_discoverability = req.body.privacy_anilist_mention == "on";
			var osu_mention_discoverability = req.body.privacy_osu_mention == "on";
			var minecraft_mention_discoverability = req.body.privacy_minecraft_mention == "on";

			var userSettings = await mongoUtil.userSettings(discordUser.id);
			userSettings.settings.privacy.show_anilist = anilist_mention_discoverability;
			userSettings.settings.privacy.show_osu = osu_mention_discoverability;
			userSettings.settings.privacy.show_minecraft = minecraft_mention_discoverability;

			if (userSettings !== req.session.user_settings) {
				await mongoUtil.updateUser(discordUser.id, userSettings);
			}

			req.session.SettingsUpdated = true;
			res.redirect("/me");
		} else {
			return res.status(401).render(path.join(__dirname, "notloggedin.ejs"));
		}
	} else {
		return res.status(401).render(path.join(__dirname, "notloggedin.ejs"));
	}
});

router.post("/guilds/update", async (req, res) => {
	console.log(req.body);

	if (req.session.discord_token && req.session.discord_id) {
		var discordUser = await utils.getDiscordUser(req.session.discord_token);
		if (discordUser.id == req.session.discord_id) {
			var guilds = await utils.getUsersGuilds(req.session.discord_token);
			guilds = guilds.filter((a) => a.owner || a.permissions == 8).map((a) => a.id);
			if (guilds.includes(req.body.guild_id)) {
				var guildBase = mongoUtil.guildBase;
				guildBase.guild_id = req.body.guild_id;
				guildBase.settings.enable_logs = req.body.enable_logs == "on";
				guildBase.settings.limit_command_channels = req.body.limit_command_channels == "on";

				if (/[0-9]+/.test(req.body.logs_channel)) {
					guildBase.settings.logs_channel = req.body.logs_channel;
				}

				var command_channels = [];
				var moderators = [];
				var disabled_commands = [];

				Object.keys(req.body).forEach((key) => {
					if (/[0-9]+/.test(key)) {
						if (req.body[key]) {
							if (key.startsWith("command_channels_")) {
								command_channels.push(req.body[key]);
							} else if (key.startsWith("moderators_")) {
								moderators.push(req.body[key]);
							} else if (key.startsWith("disabled_commands_")) {
								disabled_commands.push(req.body[key]);
							}
						}
					}
				});

				guildBase.settings.command_channels = command_channels;
				guildBase.settings.moderators = moderators;
				guildBase.settings.disable_commands = disabled_commands;

				await mongoUtil.updateGuild(req.body.guild_id, guildBase);

				req.session.GuildUpdated = true;

				res.redirect("/me");
			} else {
				return res.status(401).render(path.join(__dirname, "notloggedin.ejs"));
			}
		} else {
			return res.status(401).render(path.join(__dirname, "notloggedin.ejs"));
		}
	} else {
		return res.status(401).render(path.join(__dirname, "notloggedin.ejs"));
	}
});

module.exports = router;
