const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");

module.exports = {
	cooldown: 0,
	admin: true,
	/**
	 * @param {Discord.Client} discordClient
	 * @param {Client} hypixelClient
	 * @param {Discord.Message} message
	 * @param {String[]} args
	 */
	async run(discordClient, hypixelClient, message, args) {
		//if args[1] != null, then run the cmd thats reloaded w/ args being args[1...]
		// ^ Problem: eval uses message content not args

		if (!args || args.length < 1) return message.reply("Must provide a command name to reload");
		var commandName = args[0];
		if (commandName.startsWith("/")) commandName = commandName.substring(1);
		if (commandName.includes("/")) commandName = commandName.split("/")[commandName.split("/").length - 1];

		if (!discordClient.commands.has(commandName)) {
			return message.reply("That command does not exist");
		}
		delete require.cache[require.resolve(`../${args[0]}.js`)];
		discordClient.commands.delete(commandName);
		const props = require(`../${args[0]}.js`);
		discordClient.commands.set(commandName, props);

		message.reply(`The command ${commandName} has been reloaded`);

		if (args[1]) {
			props.run(discordClient, hypixelClient, message, args.slice(1));
		}
	}
};
