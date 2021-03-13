const path = require("path");
const mongoUtil = require("../mongoUtil");
const config = require("../config.json");
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const app = express();
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const ratelimiter = require("./ratelimiter");
const { v4: uuidv4 } = require("uuid");
const winston = require("winston");
const expressWinston = require("express-winston");
const logging = require("./logging");

mongoUtil.connectToServer(function (err, client) {
	if (err) console.log(err);
	console.log("Connected to database");
	logging.init();

	app.use(
		expressWinston.logger({
			transports: [
				new winston.transports.Loggly({
					subdomain: "uuwuu",
					inputToken: config.loggly_token,
					json: true,
					tags: ["site", "Winston-NodeJS"]
				})
			]
		})
	);

	ratelimiter.start();

	app.use(
		helmet({
			contentSecurityPolicy: false
		})
	);
	app.set("view engine", "ejs");
	app.use(cookieParser(config.secret));

	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	app.set("trust proxy", 1);
	app.use(
		session({
			secret: config.secret,
			cookie: { maxAge: Date.now() + 30 * 86400 * 1000, secure: true },
			saveUninitialized: false,
			resave: false,
			store: MongoStore.create({
				mongoUrl: `mongodb+srv://regex:${config.mongo_password}@cluster0.sswc3.mongodb.net/bot?retryWrites=true&w=majority`,
				dbName: "site"
			})
		})
	);
	app.use(mongoSanitize());

	app.use(function (req, res, next) {
		var points = 5;
		if (req.url.includes("api") || req.url.includes("me")) {
			if (req.url.includes("settings")) {
				points = 30;
			} else {
				points = 10;
			}
		}
		ratelimiter
			.getRateLimiter()
			.consume(req.ip, points)
			.then((rateLimiterRes) => {
				res.locals.discord_username = req.session.discord_username;
				res.locals.discord_id = req.session.discord_id;
				res.locals.discord_avatar = req.session.discord_avatar;
				res.locals.anilist_username = req.session.anilist_username;
				res.locals.anilist_id = req.session.anilist_id;
				res.locals.osu_username = req.session.osu_username;
				res.locals.osu_id = req.session.osu_id;
				res.locals.minecraft_username = req.session.minecraft_username;
				res.locals.minecraft_uuid = req.session.minecraft_uuid;
				next();
			})
			.catch((rateLimiterRes) => {
				return res.status(429).end();
			});
	});

	app.use("/static", express.static(path.join(__dirname, "public/static")));

	app.get("/", (req, res) => {
		res.status(200).render(path.join(__dirname, "./public/index.ejs"));
	});

	app.get("/commands", (req, res) => {
		res.status(200).render(path.join(__dirname, "./public/commands.ejs"), {
			commands: require("./public/commands.json")
		});
	});

	app.get("/about", (req, res) => {
		res.status(200).render(path.join(__dirname, "./public/about.ejs"));
	});

	app.get("/invite", (req, res) => {
		res.status(200).render(path.join(__dirname, "./public/invite.ejs"));
	});

	app.get("/thanks", (req, res) => {
		res.status(200).render(path.join(__dirname, "./public/thanks.ejs"));
	});

	app.get("/feedback", (req, res) => {
		res.status(200).render(path.join(__dirname, "./public/feedback.ejs"));
	});

	app.get("/linkminecraft", (req, res) => {
		res.status(200).render(path.join(__dirname, "./public/linkminecraft.ejs"));
	});

	app.get("/error", (req, res) => {
		res.status(200).render(path.join(__dirname, "./public/error.ejs"));
	});

	app.use("/me/", require("./public/me/me"));
	app.use("/public/api/discord/", require("./public/api/discord"));
	app.use("/public/api/anilist/", require("./public/api/anilist"));
	app.use("/public/api/minecraft/", require("./public/api/minecraft"));
	app.use("/public/api/osu/", require("./public/api/osu"));
	app.use("/public/clearcookies/", require("./public/clearcookies"));

	app.use((err, req, res, next) => {
		console.log(err);
		var error = {};
		error.code = err.code || "NONE";
		error.id = uuidv4();
		error.timestamp = new Date().toISOString();
		error.path = req.url;
		error.method = req.method;
		error.ip = req.ip;
		error.err = err;
		error.headers = req.headers;
		error.session = req.session;
		winston.info(error);
		error.err = null;
		error.headers = null;
		error.session = null;

		switch (err.message) {
			case "NoCodeProvided":
				return res.status(400).render(path.join(__dirname, "./public/error.ejs"), {
					error
				});
			default:
				return res.status(500).render(path.join(__dirname, "./public/error.ejs"), {
					error
				});
		}
	});

	app.listen(80, () => {
		console.info("Running on port 80");
		logging.get().info("Site Started");
	});

	app.get("*", function (req, res) {
		var error = {};
		error.code = "INVALID_PAGE";
		error.id = uuidv4();
		error.timestamp = new Date().toISOString();
		error.path = req.url;
		error.method = req.method;
		error.ip = req.ip;
		error.headers = req.headers;
		error.session = req.session;
		winston.info(error);
		error.err = null;
		error.headers = null;
		error.session = null;

		return res.status(400).render(path.join(__dirname, "./public/error.ejs"), {
			error
		});
	});
});
