require("dotenv").config();
const express = require("express");
const router = express.Router();
const mongoUtil = require("../../../mongoUtil");
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();
const axios = require("axios");

router.get("/unlink", async function (req, res) {
	res.cookie("minecraft_username", "", {
		maxAge: 0
	});
	res.cookie("minecraft_uuid", "", {
		maxAge: 0
	});
	var userSettings = await mongoUtil.userSettings(req.cookies.discord_id);
	userSettings.minecraft_uuid = "";
	mongoUtil.updateUser(req.cookies.discord_id, userSettings);
	res.redirect("/");
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

	res.cookie("minecraft_username", data.username, {
		httpOnly: true
	});

	res.cookie("minecraft_uuid", data.uuid, {
		httpOnly: true
	});

	const discordUser = await oauth.getUser(req.cookies.discord_token);
	const discordId = discordUser.id;
	const cookieDiscordId = req.cookies.discord_id;

	if (discordId === cookieDiscordId) {
		var userSettings = await mongoUtil.userSettings(cookieDiscordId);
		userSettings.minecraft_uuid = data.uuid;

		mongoUtil.updateUser(cookieDiscordId, userSettings);
	}

	res.redirect("/");
});

module.exports = router;
