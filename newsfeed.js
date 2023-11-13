const fetch = require("node-fetch");
const config = require("./config.json");

const webhookUrl = config.webhookUrl;

const urls = [
    "https://devforum.roblox.com/c/updates/release-notes/62.json",
    "https://devforum.roblox.com/c/updates/announcements/36.json",
    "https://devforum.roblox.com/c/updates/news-alerts/193.json",
    "https://devforum.roblox.com/c/updates/community/90.json"
]

const categoryColors = {
    "https://devforum.roblox.com/c/updates/release-notes/62.json": 178007,
    "https://devforum.roblox.com/c/updates/announcements/36.json": 14820122,
    "https://devforum.roblox.com/c/updates/news-alerts/193.json": 16766464,
    "https://devforum.roblox.com/c/updates/community/90.json": 8201933
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
    for (const i in urls) {
        const url = urls[i];
        await fetch(url)
        .then(res => res.json())
        .then(async (data) => {

            let topics = data.topic_list.topics;

            if (lastPostIds[url] == null) {
                lastPostIds[url] = topics[1].id;
            } else {
                let newestId = 0
                for (const i in topics) {
                    const topic = topics[i];
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
                                "username": "Developer Forum Newsfeed",
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
                                        "color": categoryColors[url]
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
    setTimeout(getNewPosts, 100000);
}

getNewPosts();
