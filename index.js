import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

import search from './search.js';
import memoization from './memoization.js';

const API_URL = 'https://bsky.social/xrpc';
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 3600 * 1000;


const processedMentions = new Set();


async function getAccessToken() {
    const { data } = await axios.post(`${API_URL}/com.atproto.server.createSession`, {
        identifier: process.env.IDENTIFIER,
        password: process.env.PASSWORD
    });

    return { token: data.accessJwt, did: data.did };
}

async function getMentions(token) {
    const { data } = await axios.get(`${API_URL}/app.bsky.notification.listNotifications`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return { mentions: data.notifications.filter(({ reason }) => reason === 'mention') };
}

async function reply(mention, token, did, text, link = true) {
    if (processedMentions.has(mention.cid)) {
        return { message: 'Already replied', data: null };
      }

    const replyData = {
        $type: 'app.bsky.feed.post',
        repo: did,
        collection: 'app.bsky.feed.post',
        record: {
            text: link ? `Basta clicar aqui!` : text,
            reply: {
                parent: {
                    uri: mention.uri,
                    cid: mention.cid
                },
                root: {
                    uri: mention.uri,
                    cid: mention.cid
                }
            },
            createdAt: new Date().toISOString()
        }
    };

    if(link) replyData.record.facets = [
        {
          index: {
            byteStart: 0,
            byteEnd: 18
          },
          features: [{
            $type: 'app.bsky.richtext.facet#link',
            uri: text
          }]
        }
      ]

    const { data } = await axios.post(`${API_URL}/com.atproto.repo.createRecord`, replyData, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    processedMentions.add(mention.cid);

    return { message: 'Replied successfully', data };
}

async function main() {
    try {
        const startTime = new Date().toLocaleTimeString();
        console.log(`Tick executed ${startTime}`);

        const { token, did } = await getAccessToken();

        const { mentions } = await getMentions(token);

        if (!mentions.length) {
            console.log('No mentions found');
            return;
        }

        for(let i = 0; i < mentions.length; i+=5) {
            const batch = mentions.slice(i, i + 5);
            const promises = batch.map(async (mention) => {
                const text = mention.record.text.replace(/@(\S+)/g, ``);
                const response = await memoization(search.search)(`${text} site:redecanais.africa`);
                
                if(!response) return await reply(mention, token, did, "Não encontrei nada relacionado a isso", false);

                return await reply(mention, token, did, response);
            });

            await Promise.allSettled(promises);
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

(async () => {
    await search.startBrowser();

    main();

    setInterval(() => {
        main();
    }, ONE_MINUTE);

    setInterval(() => {
        processedMentions.clear();
        console.log('Cleared processed mentions set');
      }, ONE_HOUR); 
})()

