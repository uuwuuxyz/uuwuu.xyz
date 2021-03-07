const MongoClient = require("mongodb").MongoClient;
const config = require("./config.json");
const url = `mongodb+srv://regex:${config.mongo_password}@cluster0.sswc3.mongodb.net/bot?retryWrites=true&w=majority`;
const Discord = require("discord.js");

var _db;

module.exports = {
	/**
	 * Connects to the database
	 * @param {function} callback
	 */
	connectToServer: function (callback) {
		MongoClient.connect(
			url,
			{
				useNewUrlParser: true
			},
			function (err, client) {
				if (err) {
					console.log(err);
				} else {
					_db = client.db("bot");
				}
				return callback(err);
			}
		);
	},

	/**
	 * Gets database
	 * @returns {Db} db
	 */
	getDb: function () {
		return _db;
	},

	/**
	 * Gets a collection by its name
	 * @param {String} collection Collection name
	 * @returns {import('mongodb').Collection}
	 */
	getCollection: function (collection) {
		return _db.collection(collection);
	},

	/**
	 * Queries the database
	 * @example var document = await mongoUtil.query({users: {discord_id: "id", anilist_username: "regex"}});
	 * @param {{options?: {limit?: Number=1, sort?: []|{}, min?: Number, max?: Number}, users?: {discord_id?: String, anilist_username?: String, anilist_id?: String, minecraft_uuid?: String}, guilds?: {guild_id: String}}} query Input query to send
	 * @returns {Promise}
	 * @todo Add insert, remove, and set options
	 */
	query: async function (query) {
		if (!_db) throw new Error("DatabaseNotInitialized");
		if (!query.users && !query.guilds) throw new Error("InvalidQuery - No collection specified");
		if (query.options && Object.keys(query.options).length == 0) throw new Error("InvalidQuery - Empty options object"); // options object exists but
		if ((query.users && Object.keys(query.users).length == 0) || (query.guilds && Object.keys(query.guilds).length == 0))
			throw new Error("INVALID_QUERY - Empty user or guilds object");

		if (query.users) {
			var options = Object.assign(query.users, query.options);
			delete options.limit;
			if (!query.options || !query.options.limit) {
				return _db.collection("users").findOne(options);
			} else {
				return _db.collection("users").find(options);
				// .limit(query.options.limit || 1); //limit throwing error
			}
		} else if (query.guilds) {
			var options = Object.assign(query.guilds, query.options);
			delete options.limit;
			if (!query.options || !query.options.limit) {
				return _db.collection("guilds").findOne(options);
			} else {
				return _db.collection("guilds").find(options);
				// .limit(query.options.limit || 1); //limit throwing error
			}
		}
	},

	/**
	 * @typedef GuildSettings
	 * @property {String} guild_id
	 * @property {String} owner_id
	 * @property {{logs_channel: String, enable_logs: Boolean, command_channels: String[], disable_commands: String[], limit_command_channels: Boolean, moderators: String[], moderator_commands: String[], disabled_commands: String[]}} settings
	 */

	/**
	 * @typedef UserSettings
	 * @property {String} discord_id
	 * @property {String} anilist_username
	 * @property {String} anilist_id
	 * @property {String} minecraft_uuid
	 * @property {String} osu_id
	 * @property {String} osu_username
	 * @property {{privacy:{show_anilist: Boolean, show_osu: Boolean, show_minecraft: Boolean}}} settings
	 */

	/**
	 * Gets guild settings by guild id
	 * @param {String} id
	 * @param {Discord.Client} [discordClient]
	 * @returns {Promise<GuildSettings>|GuildSettings}
	 */
	guildSettings: async function (id, discordClient) {
		if (!_db) throw new Error("DatabaseNotInitialized");
		if (discordClient.guildSettings.has(id)) {
			return discordClient.guildSettings.get(id);
		}
		return _db.collection("guilds").findOne({
			guild_id: id
		});
	},

	/**
	 * Gets multiple guilds' settings by their ids
	 * @param {String[]} ids
	 * @returns {Promise<GuildSettings[]>}
	 */
	getGuilds: async function (ids) {
		if (!_db) throw new Error("DatabaseNotInitialized");
		console.log(ids);
		return _db
			.collection("guilds")
			.find({ guild_id: { $in: ids } })
			.toArray();
	},

	/**
	 * Gets user settings by discord id
	 * @param {String} id
	 * @param {Discord.Client} [discordClient]
	 * @returns {Promise<UserSettings>}
	 */
	userSettings: async function (id, discordClient) {
		if (!_db) throw new Error("DatabaseNotInitialized");
		if (discordClient) {
			if (discordClient.userSettings.has(id)) {
				return discordClient.userSettings.get(id);
			}
		}
		return _db.collection("users").findOne({
			discord_id: id
		});
	},

	/**
	 * Inserts a guild into the database
	 * @param {GuildSettings} guildSettings
	 */
	insertGuild: async function (guildSettings) {
		if (!_db) throw new Error("DatabaseNotInitialized");
		_db.collection("guilds").insertOne(guildSettings);
	},

	/**
	 * Inserts a guild into the database
	 * @param {UserSettings} userSettings
	 */
	insertUser: async function (userSettings) {
		if (!_db) throw new Error("DatabaseNotInitialized");
		_db.collection("users").insertOne(userSettings);
	},

	/**
	 * Updates a users settings
	 * @param {String} id
	 * @param {UserSettings} userSettings
	 * @returns {Promise}
	 */
	updateUser: async function (id, userSettings) {
		if (!_db) throw new Error("DatabaseNotInitialized");
		var obj = {};
		obj.$set = userSettings;
		_db.collection("users").updateOne({ discord_id: id }, obj);
	},

	updateGuild: async function (id, guildSettings) {
		if (!_db) throw new Error("DatabaseNotInitialized");
		var obj = {};
		obj.$set = guildSettings;
		_db.collection("guilds").updateone({ guild_id: id }, obj);
	},

	userBase: {
		discord_id: "",
		anilist_username: "",
		anilist_id: "",
		minecraft_uuid: "",
		osu_username: "",
		osu_id: "",
		settings: {
			privacy: {
				show_anilist: true,
				show_osu: true,
				show_minecraft: true
			}
		}
	}
};
