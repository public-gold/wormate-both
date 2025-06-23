const WebSocket = require("ws");
const fs = require("fs");

// Ambil data dari config.txt
const config = {};
fs.readFileSync("config.txt", "utf8").split("\n").forEach(line => {
    let [key, val] = line.split("=");
    if (key && val) config[key.trim()] = val.trim();
});

const serverUrl = config.Server;
const totalBot = parseInt(config.TotalBot);
const botName = config.BotName || "BOT";
const delay = parseInt(config.Delay) || 10;

function generateLoginFrame(name) {
    const nameBuffer = Buffer.from(name, "utf8");
    const buf = Buffer.alloc(3 + nameBuffer.length);
    buf.writeUInt8(0x03, 0); // Login opcode
    buf.writeUInt8(1, 1); // 1 = player mode
    buf.writeUInt8(nameBuffer.length, 2); // panjang nama
    nameBuffer.copy(buf, 3);
    return buf;
}

let connected = 0;
function startBot(index) {
    const name = `${botName}${index}`;
    const ws = new WebSocket(serverUrl);

    ws.on("open", () => {
        const login = generateLoginFrame(name);
        ws.send(login);
        connected++;
        console.log(`[${connected}] Bot connected: ${name}`);

        // Gerakan otomatis setiap 1 detik
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                const angle = Math.random() * 2 * Math.PI;
                const buf = Buffer.alloc(2);
                buf.writeUInt8(0x06, 0); // movement opcode
                buf.writeUInt8(Math.floor(angle * 128 / Math.PI), 1);
                ws.send(buf);
            }
        }, 1000);
    });

    ws.on("error", err => {
        console.log(`[ERROR] Bot ${name} gagal konek: ${err.message}`);
    });

    ws.on("close", () => {
        console.log(`[DC] Bot ${name} terputus`);
    });
}

// Loop untuk menjalankan semua bot
let index = 1;
let interval = setInterval(() => {
    if (index > totalBot) {
        clearInterval(interval);
        console.log(`✅ Semua ${totalBot} bot sudah dicoba konek.`);
        return;
    }
    startBot(index);
    index++;
}, delay);
