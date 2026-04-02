const { makeid } = require('./gen-id');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const converter = require('./data/converter'); 
let router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    async function GIFTED_MD_QR_CODE() {
        const tempDirPath = path.join(__dirname, 'temp', id);
        const { state, saveCreds } = await useMultiFileAuthState(tempDirPath);
        
        try {
            let sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Safari"),
            });

            sock.ev.on('creds.update', saveCreds);
            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;
                if (qr) {
                    if (res && !res.headersSent) {
                        res.end(await QRCode.toBuffer(qr));
                    }
                }
                
                if (connection === "open") {
                    await delay(5000);
                    let rf = path.join(tempDirPath, 'creds.json');

                    try {
                        const sessionData = fs.readFileSync(rf, 'utf-8');
                        const base64Encoded = Buffer.from(sessionData).toString('base64');
                        const prefixedSession = "FAIZAN-MD~" + base64Encoded;
                        
                        // 1. Send Only Session ID (Extra message removed)
                        await sock.sendMessage(sock.user.id, { text: prefixedSession });
                        await delay(2000);

                        // 2. Send Description Card
                        let desc = `*┏━━━━━━━━━━━━━━*
*┃FAIZAN-MD⁸⁷³ SESSION IS*
*┃SUCCESSFULLY*
*┃CONNECTED ✅🔥*
*┗━━━━━━━━━━━━━━━*
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*❶ || Creator = *𝙵𝙰𝙸𝚉𝙰𝙽-𝙼𝙳*
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*❷ || WhatsApp Channel =* https://whatsapp.com/channel/0029VavP4nX0G0XggHzhVg0R
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*❸ || Owner =* https://wa.me/923408576674
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*❹ || Repo =* https://github.com/Faizan-MD-BOTZ/Faizan-Ai
▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*- _Powered By 𝙵𝚊𝚒𝚣𝚊𝚗-𝙼𝚍🫀𝙾𝚏𝚏𝚒𝚌𝚒𝚊𝚕_*`;
                        
                        await sock.sendMessage(sock.user.id, {
                            text: desc,
                            contextInfo: {
                                externalAdReply: {
                                    title: "𝙵𝚊𝚒𝚣𝚊𝚗-𝚖𝚍",
                                    thumbnailUrl: "https://files.catbox.moe/npizv8.jpg",
                                    sourceUrl: "https://whatsapp.com/channel/0029VavP4nX0G0XggHzhVg0R",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                        await delay(2000);

                        // 3. Send Voice Note at the very end
                        const audioPath = path.join(__dirname, 'ring.mp3');
                        if (fs.existsSync(audioPath)) {
                            const buffer = fs.readFileSync(audioPath);
                            const ptt = await converter.toPTT(buffer, 'mp3');

                            await sock.sendMessage(sock.user.id, {
                                audio: ptt,
                                mimetype: 'audio/ogg; codecs=opus',
                                ptt: true 
                            });
                        }

                        await sock.newsletterFollow("120363425143124298@newsletter");

                    } catch (e) {
                        console.error("Session Error:", e);
                    }

                    await delay(2000);
                    await sock.ws.close();
                    removeFile(tempDirPath);
                    process.exit(0);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    GIFTED_MD_QR_CODE();
                }
            });
        } catch (err) {
            removeFile(tempDirPath);
            if (res && !res.headersSent) {
                res.send({ code: "❗ Service Unavailable" });
            }
        }
    }
    await GIFTED_MD_QR_CODE();
});

module.exports = router;
