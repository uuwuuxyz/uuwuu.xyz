const path = require("path");
const mongoUtil = require("../mongoUtil");

mongoUtil.connectToServer(function (err, client) {
	if (err) console.log(err);
	console.log("Connected to database");

	const express = require("express");
	const bodyParser = require("body-parser");
	const cookieParser = require("cookie-parser");

	const app = express();
	app.set("view engine", "ejs");
	app.use(cookieParser());
	app.use(bodyParser.json());
	app.use(
		bodyParser.urlencoded({
			extended: true
		})
	);

	app.get("/", (req, res) => {
		res.status(200).render(path.join(__dirname, "./public/index.ejs"), {
			discord_username: req.cookies.discord_username,
			discord_id: req.cookies.discord_id,
			discord_token: req.cookies.discord_token,
			anilist_username: req.cookies.anilist_username,
			anilist_id: req.cookies.anilist_id,
			anilist_token: req.cookies.anilist_token,
			osu_username: req.cookies.osu_username,
			osu_id: req.cookies.osu_id,
			osu_token: req.cookies.osu_token,
			minecraft_username: req.cookies.minecraft_username,
			minecraft_uuid: req.cookies.minecraft_uuid
		});
	});

	app.use("/static", express.static(path.join(__dirname, "public/static")));

	app.get("/about", (req, res) => {
		res.sendFile(path.join(__dirname, "./public/about.html"));
	});

	app.get("/feedback", (req, res) => {
		res.sendFile(path.join(__dirname, "./public/feedback.html"));
	});

	app.get("/commands", (req, res) => {
		res.status(200).render(path.join(__dirname, "./public/commands.ejs"), {
			commands: require("./public/commands.json")
		});
	});

	app.use("/public/api/discord/", require("./public/api/discord"));
	app.use("/public/api/anilist/", require("./public/api/anilist"));
	app.use("/public/api/minecraft/", require("./public/api/minecraft"));
	app.use("/public/api/osu/", require("./public/api/osu"));
	app.use("/public/clearcookies/", require("./public/clearcookies"));

	app.use((err, req, res, next) => {
		switch (err.message) {
			case "NoCodeProvided":
				return res.status(400).send({
					status: "ERROR",
					error: err.message
				});
			default:
				return res.status(500).send({
					status: "ERROR",
					error: err.message
				});
		}
	});

	app.listen(80, () => {
		console.info("Running on port 80");
	});
});
