const Discord = require("discord.js");
const utils = require("./utils");
const mongoUtil = require("../mongoUtil");

/**
 * @param {Discord.Client} discordClient
 */
exports.run = (discordClient) => {
	(async () => {
		const messageEvents = new Map([
			["messageUpdate", "MODIFY"],
			["messageDelete", "DESTROY"]
		]);

		const guildMemberEvents = new Map([
			["guildMemberAdd", "CREATE"],
			["guildMemberUpdate", "MODIFY"],
			["guildMemberRemove", "DESTROY"]
		]);

		const guildModerationEvents = new Map([
			["guildBanAdd", "CREATE"],
			["guildBanRemove", "DESTROY"]
		]);

		const channelEvents = new Map([
			["channelCreate", "CREATE"],
			["channelUpdate", "MODIFY"],
			["channelDelete", "DESTROY"]
		]);

		const roleEvents = new Map([
			["roleCreate", "CREATE"],
			["roleUpdate", "MODIFY"],
			["roleDelete", "DESTROY"]
		]);

		const emojiEvents = new Map([
			["emojiCreate", "CREATE"],
			["emojiUpdate", "MODIFY"],
			["emojiDelete", "DESTROY"]
		]);

		messageEvents.forEach((value, key) => {
			discordClient.on(key, (oldMessage, newMessage) => {
				if (oldMessage.author.bot) return;
				var embed = getEmbed(value);
				embed = utils.getAuthor(oldMessage, embed);

				if (key == "messageUpdate") {
					if (oldMessage.content == newMessage.content) return;
					embed.setTitle("Message Edited");

					if (oldMessage.content == "" || !oldMessage.content) {
						if (oldMessage.attachments.size > 0) {
							embed.addField("Before", "<attachment>");
							embed.addField("After", newMessage.content);
						}
					} else {
						embed.addField("Before", oldMessage.content);
						embed.addField("After", newMessage.content);
					}
				} else if (key == "messageDelete") {
					embed.setTitle("Message Deleted");

					if (oldMessage.content == "" || !oldMessage.content) {
						if (oldMessage.attachments.size > 0) {
							embed.addField("Content", "<attachment>");
						}
					} else {
						embed.addField("Content", oldMessage.content);
					}
				}

				var snipe = {};
				snipe[oldMessage.channel.id] = embed;
				discordClient.snipe.set(oldMessage.guild.id, snipe);

				if (embed.fields.length > 0) sendEmbed(discordClient, embed, oldMessage.guild);
			});
		});

		guildMemberEvents.forEach((value, key) => {
			discordClient.on(key, (oldMember, newMember) => {
				var embed = getEmbed(value);
				embed.setAuthor(oldMember.user.username, oldMember.user.avatarURL());

				if (key == "guildMemberAdd") {
					embed.setTitle("Member Joined");
					embed.setDescription("<@" + oldMember.user.id + ">");
					embed.setFooter(oldMember.user.id);
				} else if (key == "guildMemberUpdate") {
					const oldRoles = oldMember._roles;
					const newRoles = newMember._roles;

					if (oldRoles.length > newRoles.length) {
						embed.setTitle("Role(s) removed from " + oldMember.user.username + "#" + oldMember.user.discriminator);
						let difference = oldRoles.filter((x) => !newRoles.includes(x));
						var diff = "";
						difference.forEach((role) => {
							diff += "<@&" + role + "> ";
						});
						embed.setDescription(diff);
					} else if (newRoles.length > oldRoles.length) {
						embed.setTitle("Role(s) added to " + oldMember.user.username + "#" + oldMember.user.discriminator);
						let difference = newRoles.filter((x) => !oldRoles.includes(x));
						var diff = "";
						difference.forEach((role) => {
							diff += "<@&" + role + "> ";
						});
						embed.setDescription(diff);
					}
				} else if (key == "guildMemberRemove") {
					embed.setTitle("Member Left");
					embed.setDescription(oldMember.user.username + "#" + oldMember.user.discriminator);
				}

				embed.setFooter(oldMember.user.id);

				if (embed.description) {
					sendEmbed(discordClient, embed, oldMember.guild);
				}
			});
		});

		channelEvents.forEach((value, key) => {
			discordClient.on(key, (oldChannel, newChannel) => {
				var embed = getEmbed(value);

				if (key == "channelCreate") {
					embed.setTitle("Channel Created");
					embed.setDescription("Created channel <#" + oldChannel.id + ">");
				} else if (key == "channelUpdate") {
					embed.setTitle("Channel Modified");
					embed.setDescription("");
					if (oldChannel.name != newChannel.name) {
						embed.setDescription("Name Changed & ");
						embed.addField("Name Changed: Before", oldChannel.name);
						embed.addField("Name Changed: After", newChannel.name);
					}
					if (!arraysEqual(oldChannel.permissionOverwrites.map, newChannel.permissionOverwrites.map)) {
						embed.setDescription(embed.description + "Permissions Changed & ");
					}
					if (oldChannel.topic != newChannel.topic) {
						embed.setDescription(embed.description + "Topic Changed & ");
						embed.addField("Topic Changed: Before", oldChannel.topic);
						embed.addField("Topic Changed: After", newChannel.topic);
					}
					if (oldChannel.nsfw != newChannel.nsfw) {
						embed.setDescription(embed.description + "NSFW Status Changed");
						embed.addField("NSFW Status Changed: Before", oldChannel.nsfw);
						embed.addField("NSFW Status Changed: After", newChannel.nsfw);
					}

					if (!embed.description.endsWith("NSFW Status Changed")) embed.setDescription(embed.description.substring(0, embed.description.length - 3));
				} else if (key == "channelDelete") {
					embed.setTitle("Channel Deleted");
					embed.setDescription("Deleted channel #" + oldChannel.name);
				}

				sendEmbed(discordClient, embed, oldChannel.guild);
			});
		});
	})();
};

// not sure how to collapse like you can in java... or if you can at all :shrug:
const colors = {
	LIME: 65280,
	CREATE: 65280,
	ORANGE: 16753920,
	MODIFY: 16753920,
	RED: 16711680,
	DESTROY: 16711680
};

/**
 * @param {"CREATE"|"MODIFY"|"DESTROY"} eventType
 * @returns {Discord.MessageEmbed}
 */
function getEmbed(eventType) {
	var embed = new Discord.MessageEmbed();
	switch (eventType) {
		case "CREATE":
			embed.setColor(colors.CREATE);
			break;
		case "MODIFY":
			embed.setColor(colors.MODIFY);
			break;
		case "DESTROY":
			embed.setColor(colors.DESTROY);
			break;
	}
	return embed;
}

/**
 * @param {Discord.Client} client
 * @param {Discord.MessageEmbed} embed
 * @param {Discord.Guild} guild
 */
function sendEmbed(client, embed, guild) {
	mongoUtil.guildSettings(guild.id, client).then((guildSettings) => {
		var logsChannel = guildSettings.settings.logs_channel;
		var logs = guildSettings.settings.enable_logs;
		if (logsChannel && logs) {
			client.channels.fetch(logsChannel).then((res) => {
				res.send({
					embed
				});
			});
		}
	});
}

/**
 * @param {[]} array_
 * @param {[]} array
 * @returns {Boolean}
 */
function arraysEqual(array_, array) {
	// if the other array is a falsy value, return
	if (!array) return false;

	// compare lengths - can save a lot of time
	if (array_.length != array.length) return false;

	for (var i = 0, l = array_.length; i < l; i++) {
		// Check if we have nested arrays
		if (array_[i] instanceof Array && array[i] instanceof Array) {
			// recurse into the nested arrays
			if (!array_[i].equals(array[i])) return false;
		} else if (array_[i] != array[i]) {
			// Warning - two different object instances will never be equal: {x:20} != {x:20}
			return false;
		}
	}
	return true;
}
