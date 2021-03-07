require("dotenv").config();
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();

module.exports = {
	/**
	 * @typedef User
	 * @property {String} id
	 * @property {String} username
	 * @property {String} discriminator
	 * @property {String|null|undefined} avatar
	 * @property {Boolean} [mfa_enabled]
	 * @property {String} [locale]
	 * @property {Boolean} [verified]
	 * @property {String|null|undefined} [email]
	 * @property {Number} [flags]
	 * @property {Number} [premium_type]
	 * @property {Number} [public_flags]
	 **/

	/**
	 * @typedef Guild
	 * @property {String} id
	 * @property {String} name
	 * @property {String|null|undefined} icon
	 * @property {String} [owner]
	 * @property {Number} [permissions]
	 * @property {String[]} features
	 * @property {String} [permissions_new]
	 */

	/**
	 * @param {*} token
	 * @returns {Promise<User>}
	 */
	getDiscordUser: async function (token) {
		return oauth.getUser(token);
	},

	/**
	 * @param {*} token
	 * @returns {Promise<Guild[]>}
	 */
	getUsersGuilds: async function (token) {
		return oauth.getUserGuilds(token);
	}
};
