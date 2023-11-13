const fetch = require("node-fetch");
const config = require("./config.json");

const webhookUrl = config.webhookUrl;

const urls = [
    "https://devforum.roblox.com/c/updates/release-notes/62.json",
    "https://devforum.roblox.com/c/updates/announcements/36.json"
]

const releaseNotesUrl = "https://devforum.roblox.com/c/updates/release-notes/62.json"
const announcementsUrl = "https://devforum.roblox.com/c/updates/announcements/36.json";

async function getNewPosts() {
    let currentDate = new Date;
    let currentDay = currentDate.getUTCDate();
    let currentMonth = currentDate.getUTCMonth();
    let currentYear = currentDate.getUTCFullYear()
    for (const url of urls) {
        await fetch(url)
        .then(resp => resp.json())
        .then(function(data) {
            console.log(data)
        })
    };
}

while (true) {
    getNewPosts
    setTimeout(() => {}, 1000000);
}
