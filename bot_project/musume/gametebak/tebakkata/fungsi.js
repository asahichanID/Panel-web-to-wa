import fs from "fs";
import path from "path";

const DIR = path.resolve("./musume/gametebak/tebakkata");

const FILES = fs.readdirSync(DIR)
.filter(v => /^data\d*\.json$/i.test(v))
.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));

const STATE = path.join(DIR, "state.json");

function loadState() {
    if (!fs.existsSync(STATE)) {
        const def = {
            mode: "queue",
            completed: false,
            file: 0,
            index: 0,
            lastRandom: []
        };

        fs.writeFileSync(STATE, JSON.stringify(def, null, 2));

        return def;
    }

    return JSON.parse(fs.readFileSync(STATE));
}

function saveState(state) {
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
}

function loadAll() {
    return FILES.map(file => ({
        file,
        data: JSON.parse(
            fs.readFileSync(path.join(DIR, file))
        )
    }));
}

function queueMode(files, state) {

    while (state.file < files.length) {

        const list = files[state.file].data;

        if (state.index < list.length) {

            const soal = list[state.index];

            state.index++;

            saveState(state);

            return soal;

        }

        state.file++;
        state.index = 0;
    }

    state.completed = true;
    state.mode = "random";

    saveState(state);

    return randomMode(files, state);
}

function randomMode(files, state) {

    const semua = files.flatMap(v => v.data);

    let index;

    do {

        index = Math.floor(Math.random() * semua.length);

    } while (
        state.lastRandom.includes(index)
        &&
        semua.length > state.lastRandom.length
    );

    state.lastRandom.push(index);

    if (state.lastRandom.length > 20)
        state.lastRandom.shift();

    saveState(state);

    return semua[index];
}


export function getTebakKata() {

    const files = loadAll();

    const state = loadState();

    if (state.mode === "queue")
        return queueMode(files, state);

    return randomMode(files, state);

}

export function caption(game) {

    const reward = Math.floor(Math.random() * (4555 - 2999 + 1)) + 2999;

    const dialog = [
        "Ayo Trainer! Aku yakin kamu bisa! ✨",
        "Jangan menyerah! Soalnya nggak sesulit itu kok~",
        "Hmm... aku jadi lapar sambil nunggu jawabanmu. 🥕",
        "Fokus ya! Jangan sampai waktunya habis!",
        "Kalau berhasil kita makan bareng ya! 🍚",
        "Aku percaya sama jawabanmu, Trainer!",
        "Semangat! Aku bakal nunggu jawabanmu~",
        "Jawab dengan tenang, jangan buru-buru ya!"
    ];

    const message = dialog[Math.floor(Math.random() * dialog.length)];

    return {
        reward,
        caption: `
╭━━━━━━━━━━━━━━━━━━━━━━⬣
┃ 🐴 𝗢𝗚𝗨𝗥𝗜 𝗖𝗔𝗣 • Tebak Kata
┣━━━━━━━━━━━━━━━━━━━━━━
┃
┃ 📖 Soal
┃ ❝ ${game.question} ❞
┃
┣━━━━━━━━━━━━━━━━━━━━━━
┃ 🥕 Reward
┃ ➜ +${reward.toLocaleString("id-ID")} Carrot Coin
┃
┃ ⏳ Waktu
┃ ➜ 60 Detik
┃
┃ 💡 Hint
┃ ➜ Akan muncul sebentar lagi...
┃
┣━━━━━━━━━━━━━━━━━━━━━━
┃ 🍚 Oguri Cap
┃ "${message}"
┃
┣━━━━━━━━━━━━━━━━━━━━━━
┃ 💬 Balas pesan ini
┃ untuk mengirim jawaban!
╰━━━━━━━━━━━━━━━━━━━━━━⬣`
    };

}