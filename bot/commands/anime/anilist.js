const Discord = require("discord.js");
const { Client } = require("@zikeji/hypixel");
const utils = require("../../utils");
const fs = require("fs");
const path = require("path");
const mongoUtil = require("../../../mongoUtil");
const anilistQuery = fs.readFileSync(path.resolve(__dirname, "../../../data/anilist/queries/anilist"), "utf8");
const request = require("request");
require("../../ExtendedMessage");

module.exports = {
	cooldown: 20,
	admin: false,
	/**
	 * @param {Discord.Client} discordClient
	 * @param {Client} hypixelClient
	 * @param {Discord.Message} message
	 * @param {String[]} args
	 */
	async run(discordClient, hypixelClient, message, args) {
		var id;
		var username;

		if (message.mentions.users.size > 0) {
			id = message.mentions.users.first().id;
		} else if (args.length == 0) {
			id = message.author.id;
		}

		if (id) {
			var userSettings = await mongoUtil.userSettings(id, discordClient);

			if (id != message.author.id) {
				if (!userSettings || !userSettings.anilist_username) {
					return message.reply(utils.getErrorEmbed("This user does not have an anilist account linked"));
				}

				if (!userSettings.settings.privacy.show_anilist) {
					return message.reply(utils.getErrorEmbed("This user has their anilist account hidden!"));
				}
			} else {
				if (!userSettings || !userSettings.anilist_username) {
					return message.reply(utils.getErrorEmbed("You do not have an anilist account linked"));
				}
			}
			username = userSettings.anilist_username;
		}

		if (args.length > 0 && message.mentions.users.size == 0) username = args[0];

		if (!username) return message.reply(utils.getErrorEmbed("Please include an anilist username"));

		var query = anilistQuery
			.replace("%%1%%", `name: "${username}"`)
			.replace("%%2%%", `userName: "${username}", type: ANIME`)
			.replace("%%3%%", `userName: "${username}", type: MANGA`)
			.replace("%%4%%", `userName: "${username}", sort: UPDATED_TIME_DESC`);

		var options = {
			uri: "https://graphql.anilist.co",
			method: "POST",
			json: {
				query
			}
		};

		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				try {
					//reuse for list cmd
					var animeListPlanning;
					var animeListCompleted;
					var animeListCurrent;
					var animeListDropped;
					var animeListPaused;

					for (i = 0; i < body.data.anime.lists.length; i++) {
						var list = body.data.anime.lists[i];
						var status = list.status;

						if (status == "PLANNING") {
							animeListPlanning = list;
						} else if (status == "COMPLETED") {
							animeListCompleted = list;
						} else if (status == "CURRENT") {
							animeListCurrent = list;
						} else if (status == "DROPPED") {
							animeListDropped = list;
						} else if (status == "PAUSED") {
							animeListPaused = list;
						}
					}

					var animeListCompletedGenresMap = new Map();
					animeListCompleted.entries.forEach((entry) => {
						entry.media.genres.forEach((genre) => {
							if (animeListCompletedGenresMap.has(genre)) {
								animeListCompletedGenresMap.set(genre, animeListCompletedGenresMap.get(genre) + 1);
							} else {
								animeListCompletedGenresMap.set(genre, 1);
							}
						});
					});
					animeListCompletedGenresMap = utils.sortMap(animeListCompletedGenresMap, "values", "desc");
					var user = body.data.User;

					var name = user.name;
					var about = user.about == null ? "" : user.about;
					var avatar = user.avatar.large;
					var bannerImage = user.bannerImage;
					var siteUrl = user.siteUrl;
					var statistics = user.statistics;

					var animeCount = statistics.anime.count;
					var timeWatched = statistics.anime.minutesWatched;
					var episodesWatched = statistics.anime.episodesWatched;

					var topThreeAnimeGenres = "";
					var i = 0;

					animeListCompletedGenresMap.forEach((value, key) => {
						if (i < 3) {
							topThreeAnimeGenres += `${key}: ${value}\n`;
							i++;
						}
					});
					topThreeAnimeGenres = topThreeAnimeGenres.trim();

					// TODO: change this to be completed manga only as well
					var mangaCount = statistics.manga.count;
					var chaptersRead = statistics.manga.chaptersRead;
					var volumesRead = statistics.manga.volumesRead;
					var mangaGenres = statistics.manga.genres;

					var sortedMangaGenres = mangaGenres.sort((a, b) => (a.count > b.count ? -1 : 1));
					var topThreeMangaGenres = "";
					for (i = 0; i < 3; i++) {
						topThreeMangaGenres += `${sortedMangaGenres[i].genre}: ${sortedMangaGenres[i].count}\n`;
					}
					topThreeMangaGenres = topThreeMangaGenres.trim();

					var profileColor = user.options.profileColor;

					var recentActivity = body.data.Page.mediaList[0];
					var recentType = recentActivity.media.type;
					var recentProgress = recentActivity.progress;
					var recentEnglishTitle = recentActivity.media.title.english;
					var recentRomajiTitle = recentActivity.media.title.romaji;
					var recentStatus = recentActivity.status;

					var recentActivityString;
					if (recentActivity) {
						var recentTitleString;

						if (recentEnglishTitle) {
							recentTitleString = recentEnglishTitle;
							if (recentRomajiTitle) {
								if (recentEnglishTitle != recentRomajiTitle) {
									recentTitleString = recentEnglishTitle + ` (${recentRomajiTitle})`;
								}
							}
						} else {
							recentTitleString = recentRomajiTitle;
						}

						if (recentType == "ANIME") {
							if (recentStatus == "PLANNING") {
								recentActivityString = `Plans to watch ${recentTitleString}`;
							} else if (recentStatus == "CURRENT") {
								recentActivityString = `Watched episode ${recentProgress} of ${recentTitleString}`;
							} else if (recentStatus == "COMPLETED") {
								recentActivityString = `Completed ${recentTitleString}`;
							} else if (recentStatus == "REPEATING") {
								recentActivityString = `Rewatched episode ${recentProgress} of ${recentTitleString}`;
							}
						} else if (recentType == "MANGA") {
							if (recentStatus == "PLANNING") {
								recentActivityString = `Plans to read ${recentTitleString}`;
							} else if (recentStatus == "CURRENT") {
								recentActivityString = `Read chapter ${recentProgress} of ${recentTitleString}`;
							} else if (recentStatus == "COMPLETED") {
								recentActivityString = `Completed ${recentTitleString}`;
							} else if (recentStatus == "REPEATING") {
								recentActivityString = `Reread chapter ${recentProgress} of ${recentTitleString}`;
							}
						}
					}

					var embed = new Discord.MessageEmbed();
					embed = utils.getAuthor(message, embed);
					embed.setColor(getColorFromString(profileColor));
					embed.setTitle(name);
					embed.setURL(siteUrl);
					embed.setDescription(about);
					embed.setThumbnail(avatar);
					embed.setImage(bannerImage);

					embed.addField("List Entries", animeCount + mangaCount, false);
					embed.addField("Anime Watched", animeListCompleted.entries.length, true);
					embed.addField("Eps. Watched", episodesWatched, true);
					embed.addField("Time Watched", utils.formatTime(timeWatched), true);

					embed.addField("Manga Read", mangaCount, true);
					embed.addField("Chapters Read", chaptersRead, true);
					embed.addField("Volumes Read", volumesRead, true);

					embed.addField("Most Watched Genres", topThreeAnimeGenres, true);
					embed.addField("Most Read Genres", topThreeMangaGenres, true);

					if (recentActivity) embed.addField("Recent Activity", recentActivityString, false);

					message.reply({ embed });
				} catch (e) {
					message.reply(utils.getErrorEmbed("Something went wrong! Invalud username?"));
				}
			} else {
				message.reply(utils.getErrorEmbed("Something went wrong! Invalud username?"));
			}
		});
	}
};

/**
 * @param {String} color
 */
function getColorFromString(color) {
	switch (color) {
		case "blue":
			return 4044018;
		case "purple":
			return 12608511;
		case "green":
			return 5032529;
		case "orange":
			return 15697946;
		case "red":
			return 14758707;
		case "pink":
			return 16555478;
		default:
			return 6781844; //gray
	}
}
