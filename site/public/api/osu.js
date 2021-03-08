require("dotenv").config();
const config = require("../../../config.json");
const express = require("express");
const router = express.Router();
const mongoUtil = require("../../../mongoUtil");
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();
const axios = require("axios");

router.get("/unlink", async function (req, res) {
	req.session.osu_username = "";
	req.session.osu_id = "";
	req.session.osu_token = "";

	var userSettings = await mongoUtil.userSettings(req.session.discord_id);
	userSettings.osu_username = "";
	userSettings.osu_id = "";
	mongoUtil.updateUser(req.session.discord_id, userSettings);
	res.redirect("/me");
});

router.get("/login", (req, res) => {
	if (process.env.DEV == "true") {
		res.redirect(
			"https://osu.ppy.sh/oauth/authorize?client_id=4885&redirect_uri=http%3A%2F%2Flocalhost%2Fpublic%2Fapi%2Fosu%2Fcallback&response_type=code&scope=identify"
		);
	} else {
		res.redirect(
			"https://osu.ppy.sh/oauth/authorize?client_id=4884&redirect_uri=https%3A%2F%2Fuuwuu.xyz%2Fpublic%2Fapi%2Fosu%2Fcallback&response_type=code&scope=identify"
		);
	}
});

router.get("/callback", async function (req, res) {
	var dev = process.env.DEV == "true";
	var clientId = dev ? 4885 : 4884;
	var clientSecret = dev ? config.osu_dev_secret : config.osu_secret;
	var redirectUri = dev ? "http://localhost/public/api/osu/callback" : "https://uuwuu.xyz/public/api/osu/callback";

	const params = new URLSearchParams();
	params.append("grant_type", "authorization_code");
	params.append("client_id", clientId);
	params.append("client_secret", clientSecret);
	params.append("code", req.query.code);
	params.append("redirect_uri", redirectUri);

	const options = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json"
		}
	};

	var tokenRequest = await axios.post("https://osu.ppy.sh/oauth/token", params, options);

	var token = tokenRequest.data.access_token;

	const userOptions = {
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"Authorization": "Bearer " + token
		}
	};

	var userInfoRequest = await axios.get("https://osu.ppy.sh/api/v2/me/", userOptions);

	req.session.osu_token = token;
	req.session.osu_username = userInfoRequest.data.username;
	req.session.osu_id = userInfoRequest.data.id;

	const discordUser = await oauth.getUser(req.session.discord_token);
	const discordId = discordUser.id;
	const cookieDiscordId = req.session.discord_id;

	if (discordId === cookieDiscordId) {
		var userSettings = await mongoUtil.userSettings(cookieDiscordId);
		userSettings.osu_id = userInfoRequest.data.id;
		userSettings.osu_username = userInfoRequest.data.username;
		mongoUtil.updateUser(cookieDiscordId, userSettings);
	}

	res.redirect("/me");
});

module.exports = router;
