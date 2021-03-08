require("dotenv").config();
const config = require("../config.json");
const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const fs = require("fs");
const cacheManager = require("cache-manager");
const mongoUtil = require("../mongoUtil");
const { default: axios } = require("axios");
const Enmap = require("enmap");
require("./ExtendedMessage");

const cache = cacheManager.caching({
	store: "memory",
	ttl: 5 * 60,
	max: 500
});

mongoUtil.connectToServer(function (err, client) {
	if (err) console.log(err);
	console.log("Connected to database");

	const hypixelClient = new Client(config.hypixel_api_key, {
		cache: {
			get(key) {
				return cache.get(`hypixel:${key}`);
			},
			set(key, value) {
				let ttl = 5 * 60;

				if (key.startsWith("resources:")) {
					ttl = 24 * 60 * 60;
				} else if (key === "skyblock:bazaar") {
					ttl = 10;
				} else if (key.startsWith("skyblock:auctions:")) {
					ttl = 60;
				}
				return cache.set(`hypixel:${key}`, value);
			}
		}
	});

	var devEnv = process.env.DEV == "true";

	const discordClient = new Discord.Client();

	if (devEnv) {
		discordClient.login(config.discord_dev_token);
		discordClient.prefix = ">!";
	} else {
		discordClient.login(config.discord_token);
		discordClient.prefix = ">";
	}

	discordClient.commands = new Enmap();
	discordClient.cooldowns = new Discord.Collection();
	discordClient.snipe = new Discord.Collection();
	discordClient.guildSettings = new Discord.Collection();
	discordClient.userSettings = new Discord.Collection();
	discordClient.artCache = new Discord.Collection();

	axios.get("https://art.uuwuu.xyz/ws.php?format=json&method=pwg.categories.getList&recursive=true").then((response) => {
		discordClient.artCache.set("categories", response.data.result.categories);
	});

	var logging = require("./logging");
	logging.run(discordClient);

	discordClient.on("messageUpdate", (oldMessage, newMessage) => {
		if (
			config.admins.includes(oldMessage.content) &&
			oldMessage.content.startsWith(discordClient.prefix + "eval ") &&
			newMessage.content.startsWith(discordClient.prefix + "eval ")
		) {
			let props = require(`./commands/admin/eval.js`);
			props.run(discordClient, hypixelClient, newMessage, ["true"]);
		}
	});

	discordClient.on("message", (message) => {
		if (message.content === discordClient.prefix + "clearcache" && message.author.id == "202666531111436288") {
			discordClient.cooldowns = new Discord.Collection();
			discordClient.snipe = new Discord.Collection();
			discordClient.guildSettings = new Discord.Collection();
			discordClient.userSettings = new Discord.Collection();
			discordClient.artCache = new Discord.Collection();
			axios.get("https://art.uuwuu.xyz/ws.php?format=json&method=pwg.categories.getList&recursive=true").then((response) => {
				discordClient.artCache.set("categories", response.data.result.categories);
			});

			cache.reset();

			message.reply("Cleared Cache");
		}
	});

	loadEvents("./events/");
	loadCommands("./commands/");

	function getFiles(path) {
		return fs.readdirSync(path, (err, files) => {
			return files;
		});
	}

	function loadEvents(path) {
		getFiles(path).forEach((file) => {
			if (fs.statSync(`${path}/${file}`).isDirectory()) {
				loadEvents(`${path}/${file}`);
			} else {
				const event = require(`${path}/${file}`);
				let eventName = file.split(".")[0];
				discordClient.on(eventName, event.bind(null, discordClient, hypixelClient));
				console.log(`Loaded event ${eventName}`);
			}
		});
	}

	function loadCommands(path) {
		getFiles(path).forEach((file) => {
			if (fs.statSync(`${path}/${file}`).isDirectory()) {
				loadCommands(`${path}/${file}`);
			} else {
				if (!file.endsWith(".js")) return;
				let props = require(`${path}/${file}`);
				let commandName = file.split(".")[0];
				discordClient.commands.set(commandName, props);
				console.log(`Loaded command ${file}`);
			}
		});
	}
});
