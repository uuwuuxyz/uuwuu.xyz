require("dotenv").config();
const config = require("../../../config.json");
const express = require("express");
const router = express.Router();
const mongoUtil = require("../../../mongoUtil");
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();
const axios = require("axios");
const path = require("path");
const btoa = require("btoa");

router.get("/logout", async function (req, res) {
	req.session.discord_username = "";
	req.session.discord_id = "";
	req.session.discord_token = "";
	req.session.discord_avatar = "";

	res.redirect("/");
});

router.get("/login", (req, res) => {
	if (process.env.DEV == "true") {
		res.redirect(
			"https://discord.com/api/oauth2/authorize?client_id=802515790233731072&redirect_uri=http%3A%2F%2Flocalhost%2Fpublic%2Fapi%2Fdiscord%2Fcallback&response_type=code&scope=identify%20guilds"
		);
	} else {
		res.redirect(
			"https://discord.com/api/oauth2/authorize?client_id=778936290090942514&redirect_uri=https%3A%2F%2Fuuwuu.xyz%2Fpublic%2Fapi%2Fdiscord%2Fcallback&response_type=code&scope=identify%20guilds"
		);
	}
});

router.get("/callback", async function (req, res) {
	if (!req.query.code) throw new Error("NoCodeProvided");

	const exchangeParams = new URLSearchParams();
	exchangeParams.append("grant_type", "authorization_code");
	exchangeParams.append("code", req.query.code);
	if (process.env.DEV == "true") {
		exchangeParams.append("redirect_uri", "http://localhost/public/api/discord/callback");
	} else {
		exchangeParams.append("redirect_uri", "https://uuwuu.xyz/public/api/discord/callback");
	}

	const exchangeOptions = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${btoa(
				`${process.env.DEV == "true" ? "802515790233731072" : "778936290090942514"}:${
					process.env.DEV == "true" ? config.discord_dev_secret : config.discord_secret
				}`
			)}`
		}
	};

	axios
		.post("https://discord.com/api/oauth2/token", exchangeParams, exchangeOptions)
		.then(({ data }) => {
			// Get user ID and username using the token just received
			var token = data.access_token;

			req.session.discord_token = token;

			oauth
				.getUser(token)
				.then((response) => {
					req.session.discord_avatar = response.avatar;
					req.session.discord_username = response.username + "#" + response.discriminator;
					req.session.discord_id = response.id;

					mongoUtil.userSettings(response.id).then((s) => {
						if (s) {
							res.redirect("/me");
						} else {
							var obj = mongoUtil.userBase;
							obj.discord_id = response.id;

							mongoUtil.insertUser(obj).then((x) => {
								res.redirect("/me");
							});
						}
					});
				})
				.catch((err) => {
					if (err.response) {
						console.log("API Error", err.response.data);
					} else {
						console.log("Request Error", err.message);
					}
					res.sendFile(path.join(__dirname, "../error.html"));
					return;
				});
		})
		.catch((err) => {
			if (err.response) {
				console.log("API Error", err.response.data);
			} else {
				console.log("Request Error", err.message);
			}
			res.sendFile(path.join(__dirname, "../error.html"));
			return;
		});
});

module.exports = router;
