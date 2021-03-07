require("dotenv").config();
const express = require("express");
const router = express.Router();
const mongoUtil = require("../../../mongoUtil");
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();
const axios = require("axios");

router.get("/unlink", async function (req, res) {
	req.session.minecraft_username = "";
	req.session.minecraft_uuid = "";

	var userSettings = await mongoUtil.userSettings(req.session.discord_id);
	userSettings.minecraft_uuid = "";
	mongoUtil.updateUser(req.session.discord_id, userSettings);
	res.redirect("/me");
});

router.post("/login", async function (req, res) {
	var code = req.body.code;

	if (!/[0-9]{6}/.test(code)) {
		res.redirect("/error.html");
	}

	var response = await axios.get("https://mc-oauth.net/api/api?token", { headers: { token: code } });
	if (response.status != 200) return res.redirect("/error.html");
	var data = response.data;
	if (!data || data.status != "success") return res.redirect("/error.html");

	req.session.minecraft_username = data.username;
	req.session.minecraft_uuid = data.uuid;

	const discordUser = await oauth.getUser(req.session.discord_token);
	const discordId = discordUser.id;
	const cookieDiscordId = req.session.discord_id;

	if (discordId === cookieDiscordId) {
		var userSettings = await mongoUtil.userSettings(cookieDiscordId);
		userSettings.minecraft_uuid = data.uuid;

		mongoUtil.updateUser(cookieDiscordId, userSettings);
	}

	res.redirect("/me");
});

module.exports = router;
