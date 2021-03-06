require("dotenv").config();
const config = require("../../../config.json");
const express = require("express");
const router = express.Router();
const mongoUtil = require("../../../mongoUtil");
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();
const axios = require("axios");

router.get("/unlink", async function (req, res) {
	req.session.anilist_username = "";
	req.session.anilist_id = "";
	req.session.anilist_token = "";

	var userSettings = await mongoUtil.userSettings(req.session.discord_id);
	userSettings.anilist_id = "";
	userSettings.anilist_username = "";
	mongoUtil.updateUser(req.session.discord_id, userSettings);
	res.redirect("/me");
});

router.get("/login", (req, res) => {
	if (process.env.DEV == "true") {
		res.redirect(
			"https://anilist.co/api/v2/oauth/authorize?client_id=4766&redirect_uri=http%3A%2F%2Flocalhost%2Fpublic%2Fapi%2Fanilist%2Fcallback&response_type=code"
		);
	} else {
		res.redirect(
			"https://anilist.co/api/v2/oauth/authorize?client_id=4221&redirect_uri=https%3A%2F%2Fuuwuu.xyz%2Fpublic%2Fapi%2Fanilist%2Fcallback&response_type=code"
		);
	}
});

router.get("/callback", async function (req, res) {
	if (!req.query.code) throw new Error("NoCodeProvided");
	var dev = process.env.DEV == "true";
	var clientId = dev ? 4766 : 4221;
	var clientSecret = dev ? config.anilist_dev_secret : config.anilist_secret;
	var redirectUri = dev ? "http://localhost/public/api/anilist/callback" : "https://uuwuu.xyz/public/api/anilist/callback";

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

	var tokenRequest = await axios.post("https://anilist.co/api/v2/oauth/token", params, options);

	var token = tokenRequest.data.access_token;

	const userOptions = {
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"Authorization": "Bearer " + token
		}
	};

	var userInfoRequest = await axios.post("https://graphql.anilist.co", { query: `mutation {UpdateUser {id name}}` }, userOptions);

	var user = userInfoRequest.data.data.UpdateUser;

	req.session.anilist_token = token;
	req.session.anilist_username = user.name;
	req.session.anilist_id = user.id;

	const discordUser = await oauth.getUser(req.session.discord_token);
	const discordId = discordUser.id;
	const cookieDiscordId = req.session.discord_id;

	if (discordId === cookieDiscordId) {
		var userSettings = await mongoUtil.userSettings(cookieDiscordId);
		userSettings.anilist_username = user.name;
		userSettings.anilist_id = user.id;

		mongoUtil.updateUser(cookieDiscordId, userSettings);
	}

	res.redirect("/me");
});

module.exports = router;
