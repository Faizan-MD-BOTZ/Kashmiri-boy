const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function toPTT(buffer, ext) {
    return new Promise((resolve, reject) => {
    
        const tmp = path.join(__dirname, `../temp/${Date.now()}.${ext}`);
        const out = path.join(__dirname, `../temp/${Date.now()}.opus`);

        if (!fs.existsSync(path.join(__dirname, '../temp'))) {
            fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
        }

        fs.writeFileSync(tmp, buffer);

        const ffmpeg = spawn('ffmpeg', [
            '-i', tmp,
            '-c:a', 'libopus',
            '-b:a', '128k',
            '-vbr', 'on',
            '-compression_level', '10', 
            '-ar', '48000',
            '-ac', '1',    
            '-f', 'opus',
            out
        ]);

        ffmpeg.on('error', (err) => {
            if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
            reject(err);
        });

        ffmpeg.on('close', (code) => {
            if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
            if (code !== 0) return reject(new Error('FFmpeg conversion failed'));

            const pttBuffer = fs.readFileSync(out);
            if (fs.existsSync(out)) fs.unlinkSync(out);
            resolve(pttBuffer);
        });
    });
}

module.exports = { toPTT };
