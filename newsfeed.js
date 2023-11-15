const fetch = require("node-fetch");
const config = require("./config.json");

const webhookUrl = config.webhookUrl;

const trackedCategoryUrls  = [
    "https://devforum.roblox.com/c/updates/release-notes/62.json",
    "https://devforum.roblox.com/c/updates/announcements/36.json",
    "https://devforum.roblox.com/c/updates/news-alerts/193.json",
    "https://devforum.roblox.com/c/updates/community/90.json",
]

const categoryNames = {
    "https://devforum.roblox.com/c/updates/release-notes/62.json": "[Release Notes]",
    "https://devforum.roblox.com/c/updates/announcements/36.json": "[Announcements]",
    "https://devforum.roblox.com/c/updates/news-alerts/193.json": "[News Alerts]",
    "https://devforum.roblox.com/c/updates/community/90.json": "[Community]",
}

const categoryColors = {
    "https://devforum.roblox.com/c/updates/release-notes/62.json": 178007,
    "https://devforum.roblox.com/c/updates/announcements/36.json": 14820122,
    "https://devforum.roblox.com/c/updates/news-alerts/193.json": 16766464,
    "https://devforum.roblox.com/c/updates/community/90.json": 8201933,
}

const lastPostIds = {}

function removeTags(str) { 
    if ((str===null) || (str==='')) 
        return false; 
    else
        str = str.toString(); 
    return str.replace( /(<([^>]+)>)/ig, ''); 
} 

async function getNewPosts() {
    for (const urlIndex in trackedCategoryUrls) {
        const url = trackedCategoryUrls[urlIndex];
        await fetch(url)
        .then(res => res.json())
        .then(async (data) => {

            let topics = data.topic_list.topics;

            if (lastPostIds[url] == null) {
                let lastUnpinnedPostId = 0
                for (const postNumber in topics) {
                    if (!topics[postNumber].pinned) {
                        lastUnpinnedPostId = topics[postNumber].id;
                        break;
                    }
                }
                lastPostIds[url] = lastUnpinnedPostId
            } else {
                let newestId = 0
                for (const topicIndex in topics) {
                    const topic = topics[topicIndex];
                    if (topic.id > lastPostIds[url]) {

                        let topicUrl = `https://devforum.roblox.com/t/${topic.slug}/${topic.id}`;

                        await fetch(`${topicUrl}.json`)
                        .then(res => res.json())
                        .then(async function(thread) {
                            let details = thread.details;
                            let author = details.created_by;
                            let post = thread.post_stream.posts[0];
                            let avatarUrl = author.avatar_template.replace("{size}", "45");
                            let iconUrl = `https://doy2mn9upadnk.cloudfront.net${avatarUrl}`;
                            let content = removeTags(post.cooked);

                            let maxContentLength = 200;
                            if (content.length > maxContentLength) {
                                content = `${content.slice(0, maxContentLength)}...`;
                            }

                            let newMessage = {
                                "username": "",
                                "avatar_url": "",
                                "content": "",
                                "embeds": [
                                    {
                                        "author": {
                                            "name": author.name,
                                            "url": `https://doy2mn9upadnk.cloudfront.net/u/${author.name}/summary`,
                                            "icon_url": iconUrl
                                        },
                                        "title": topic.title,
                                        "url": topicUrl,
                                        "description": content,
                                        "color": categoryColors[url],
                                        "timestamp": topic.created_at,
                                        "footer": {
                                            "text": categoryNames[url]
                                        }
                                    }
                                ]
                            }

                            await fetch(webhookUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(newMessage)
                            });
                        });

                        if (topic.id > newestId) {
                            newestId = topic.id;
                        }

                        lastPostIds[url] = newestId;
                    }
                };
            }
        });
    };
    setTimeout(getNewPosts, 60000);
}

getNewPosts();
