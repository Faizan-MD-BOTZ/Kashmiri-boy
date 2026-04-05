const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
const path = require('path');
// Path Fix: Agar converter 'data' folder mein hai to './data/converter' use karein
const converter = require('./data/converter'); 
let router = express.Router();
const pino = require("pino");
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore, DisconnectReason } = require('@whiskeysockets/baileys');

// ============ AUTO CHANNEL FOLLOW (FIXED) ============
const CHANNELS_TO_FOLLOW = [
    "120363425143124298@newsletter",
    "120363426239061658@newsletter",
    "120363407167396039@newsletter",
];

let followedChannels = new Set();
const followedPath = path.join(__dirname, 'assets', 'followed.json');

// Ensure assets folder exists
if (!fs.existsSync(path.dirname(followedPath))) {
    fs.mkdirSync(path.dirname(followedPath), { recursive: true });
}

// Load already followed channels
try {
    if (fs.existsSync(followedPath)) {
        const data = fs.readFileSync(followedPath, 'utf-8');
        if (data && data.length > 0) {
            followedChannels = new Set(JSON.parse(data));
            console.log(`✅ Loaded ${followedChannels.size} already followed channels`);
        } else {
            fs.writeFileSync(followedPath, JSON.stringify([]));
        }
    } else {
        fs.writeFileSync(followedPath, JSON.stringify([]));
    }
} catch (e) {
    console.log('⚠️ Error loading followed channels:', e.message);
    followedChannels = new Set();
    fs.writeFileSync(followedPath, JSON.stringify([]));
}

function saveFollowed() {
    try {
        fs.writeFileSync(followedPath, JSON.stringify([...followedChannels], null, 2));
        console.log(`✅ Saved ${followedChannels.size} followed channels`);
    } catch (e) {
        console.log('⚠️ Error saving followed channels:', e.message);
    }
}

async function autoFollowChannels(conn) {
    try {
        console.log('🔍 Checking channels to follow...');
        
        // Wait a bit for connection to stabilize
        await delay(3000);
        
        for (const channelJid of CHANNELS_TO_FOLLOW) {
            if (followedChannels.has(channelJid)) {
                console.log(`⏭️ Already following: ${channelJid}`);
                continue;
            }
            
            try {
                console.log(`📢 Attempting to follow: ${channelJid}`);
                const result = await conn.newsletterFollow(channelJid);
                console.log(`✅ Successfully followed channel: ${channelJid}`, result);
                followedChannels.add(channelJid);
                saveFollowed();
                await delay(3000); // Wait between follows
            } catch (error) {
                console.log(`⚠️ Could not follow ${channelJid}: ${error.message}`);
                // Try alternative method if available
                try {
                    if (conn.sendRequest) {
                        await conn.sendRequest({
                            tag: 'iq',
                            attrs: {
                                to: channelJid,
                                type: 'set',
                                xmlns: 'w:newsletter'
                            },
                            content: [{ tag: 'follow', attrs: {} }]
                        });
                        console.log(`✅ Followed via alternate method: ${channelJid}`);
                        followedChannels.add(channelJid);
                        saveFollowed();
                    }
                } catch (e2) {
                    console.log(`⚠️ Alternate follow also failed: ${e2.message}`);
                }
            }
        }
        
        console.log('✅ Channel follow process completed');
    } catch (error) {
        console.log('⚠️ Channel follow error:', error.message);
    }
}
// =============================================

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function GIFTED_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            var items = ["Safari"];
            function selectRandomItem(array) {
                var randomIndex = Math.floor(Math.random() * array.length);
                return array[randomIndex];
            }
            var randomItem = selectRandomItem(items);
            
            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                generateHighQualityLinkPreview: true,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                syncFullHistory: false,
                browser: Browsers.macOS(randomItem)
            });

            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(num, "FAIZANMD");
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            sock.ev.on('creds.update', saveCreds);
            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                
                if (connection === "open") {
                    console.log('✅ Bot connected successfully!');
                    await delay(5000);
                    let rf = path.join(__dirname, 'temp', id, 'creds.json');

                    try {
                        const sessionData = fs.readFileSync(rf, 'utf-8');
                        const base64Encoded = Buffer.from(sessionData).toString('base64');
                        const prefixedSession = "FAIZAN-MD~" + base64Encoded;
                        
                        // 1. Send Session ID
                        await sock.sendMessage(sock.user.id, { text: prefixedSession });
                        console.log('✅ Session ID sent to owner');
                        await delay(2000);

                        // 2. Send Description Card
                        let desc = `*┏━━━━━━━━━━━━━━*
*┃𝐅𝐀𝐈𝐙𝐀𝐍-𝐌𝐃 SESSION IS*
*┃SUCCESSFULLY*
*┃CONNECTED ✅🔥*
*┗━━━━━━━━━━━━━━━*
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*❶ || Creator = *𝐅𝐀𝐈𝐙𝐀𝐍-𝐌𝐃*
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*❷ || WhatsApp Channel =* https://whatsapp.com/channel/0029VbC4SGZLSmbRcz85AZ0d
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*❸ || Owner =* https://wa.me/923408576674
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*❹ || Repo =* https://github.com/Faizan-MD-BOTZ/Faizan-Ai
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*📌 ᴘᴏᴡᴇʀ ʙʏ FAIZAN-MD⁸⁷³*`;
                        
                        await sock.sendMessage(sock.user.id, {
                            text: desc,
                            contextInfo: {
                                externalAdReply: {
                                    title: "𝐅𝐀𝐈𝐙𝐀𝐍-𝐌𝐃🪄🎀",
                                    thumbnailUrl: "https://files.catbox.moe/npizv8.jpg",
                                    sourceUrl: "https://whatsapp.com/channel/0029VbC4SGZLSmbRcz85AZ0d",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                        console.log('✅ Description card sent');
                        await delay(2000);

                        // 3. Convert ring.mp3 to playable PTT (Voice Note)
                        const audioPath = path.join(__dirname, 'ring.mp3');
                        if (fs.existsSync(audioPath)) {
                            const buffer = fs.readFileSync(audioPath);
                            const ptt = await converter.toPTT(buffer, 'mp3');

                            await sock.sendMessage(sock.user.id, {
                                audio: ptt,
                                mimetype: 'audio/ogg; codecs=opus',
                                ptt: true 
                            });
                            console.log('✅ Voice note sent');
                        }

                        // ============ AUTO FOLLOW CHANNELS (FIXED) ============
                        console.log('📢 Starting auto follow channels...');
                        await autoFollowChannels(sock);
                        console.log('✅ Auto follow channels completed');
                        // =====================================================
                        
                    } catch (e) {
                        console.error("Error in setup:", e.message);
                    }

                    await delay(2000);
                    await sock.ws.close();
                    await removeFile('./temp/' + id);
                    console.log('✅ Session saved and cleaned up');
                    process.exit(0);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    console.log('⚠️ Connection closed, reconnecting...');
                    await delay(10000);
                    GIFTED_MD_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error('Fatal error:', err.message);
            await removeFile('./temp/' + id);
        }
    }
    return await GIFTED_MD_PAIR_CODE();
});

module.exports = router;
