// ---------- Insert Your Data ---------- //

const BOT_TOKEN = "BOT_TOKEN"; // Insert your bot token.
const BOT_WEBHOOK = "/endpoint"; // Let it be as it is.
const BOT_SECRET = "BOT_SECRET"; // Insert a powerful secret text (only [A-Z, a-z, 0-9, _, -] are allowed).
const BOT_OWNER = 123456789; // Insert your telegram account id.
const BOT_CHANNEL = -100123456789; // Insert your telegram channel id which the bot is admin in.
const SIA_SECRET = "SIA_SECRET"; // Insert a powerful secret text and keep it safe.
const PUBLIC_BOT = false; // Make your bot public (only [true, false] are allowed).

// ---------- Do Not Modify ---------- // 

const WHITE_METHODS = ["GET", "POST", "HEAD"];
const HEADERS_FILE = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"};
const HEADERS_ERRR = {'Access-Control-Allow-Origin': '*', 'content-type': 'application/json'};
const ERROR_404 = {"ok":false,"error_code":404,"description":"Bad Request: missing /?file= parameter", "credit": "https://github.com/vauth/filestream-cf"};
const ERROR_405 = {"ok":false,"error_code":405,"description":"Bad Request: method not allowed"};
const ERROR_406 = {"ok":false,"error_code":406,"description":"Bad Request: file type invalid"};
const ERROR_407 = {"ok":false,"error_code":407,"description":"Bad Request: file hash invalid by atob"};
const ERROR_408 = {"ok":false,"error_code":408,"description":"Bad Request: mode not in [attachment, inline]"};

// ---------- Event Listener ---------- // 

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event))
});

async function handleRequest(event) {
    const url = new URL(event.request.url);
    const file = url.searchParams.get('file');
    const mode = url.searchParams.get('mode') || "attachment";
     
    if (url.pathname === BOT_WEBHOOK) {return Bot.handleWebhook(event)}
    if (url.pathname === '/registerWebhook') {return Bot.registerWebhook(event, url, BOT_WEBHOOK, BOT_SECRET)}
    if (url.pathname === '/unregisterWebhook') {return Bot.unregisterWebhook(event)}
    if (url.pathname === '/getMe') {return new Response(JSON.stringify(await Bot.getMe()), {headers: HEADERS_ERRR, status: 202})}

    if (!file) {return Raise(ERROR_404, 404);}
    if (!["attachment", "inline"].includes(mode)) {return Raise(ERROR_408, 404)}
    if (!WHITE_METHODS.includes(event.request.method)) {return Raise(ERROR_405, 405);}
    try {await Cryptic.deHash(file)} catch {return Raise(ERROR_407, 404)}

    const channel_id = BOT_CHANNEL;
    const file_id = await Cryptic.deHash(file);
    const retrieve = await RetrieveFile(channel_id, file_id);
    if (retrieve.error_code) {return await Raise(retrieve, retrieve.error_code)};

    const rdata = retrieve[0]
    const rname = retrieve[1]
    const rsize = retrieve[2]
    const rtype = retrieve[3]

    return new Response(rdata, {
        status: 200, headers: {
            "Content-Disposition": `${mode}; filename=${rname}`, // inline;
            "Content-Length": rsize,
            "Content-Type": rtype,
            ...HEADERS_FILE
        }
    });
}

// ---------- Retrieve File ---------- //

async function RetrieveFile(channel_id, message_id) {
    let  fID; let fName; let fType; let fSize; let fLen;
    let data = await Bot.editMessage(channel_id, message_id, await UUID());
    if (data.error_code){return data}
    
    if (data.document){
        fLen = data.document.length - 1
        fID = data.document.file_id;
        fName = data.document.file_name;
        fType = data.document.mime_type;
        fSize = data.document.file_size;
    } else if (data.audio) {
        fLen = data.audio.length - 1
        fID = data.audio.file_id;
        fName = data.audio.file_name;
        fType = data.audio.mime_type;
        fSize = data.audio.file_size;
    } else if (data.video) {
        fLen = data.video.length - 1
        fID = data.video.file_id;
        fName = data.video.file_name;
        fType = data.video.mime_type;
        fSize = data.video.file_size;
    } else if (data.photo) {
        fLen = data.photo.length - 1
        fID = data.photo[fLen].file_id;
        fName = data.photo[fLen].file_unique_id + '.jpg';
        fType = "image/jpg";
        fSize = data.photo[fLen].file_size;
    } else {
        return ERROR_406
    }

    const file = await Bot.getFile(fID)
    if (file.error_code){return file}

    return [await Bot.fetchFile(file.file_path), fName, fSize, fType];
}

// ---------- Raise Error ---------- //

async function Raise(json_error, status_code) {
    return new Response(JSON.stringify(json_error), { headers: HEADERS_ERRR, status: status_code });
}

// ---------- UUID Generator ---------- //

async function UUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ---------- Hash Generator ---------- //

class Cryptic {
  static async getSalt(length = 16) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < length; i++) {
        salt += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return salt;
  }

  static async getKey(salt, iterations = 1000, keyLength = 32) {
    const key = new Uint8Array(keyLength);
    for (let i = 0; i < keyLength; i++) {
        key[i] = (SIA_SECRET.charCodeAt(i % SIA_SECRET.length) + salt.charCodeAt(i % salt.length)) % 256;
    }
    for (let j = 0; j < iterations; j++) {
        for (let i = 0; i < keyLength; i++) {
            key[i] = (key[i] + SIA_SECRET.charCodeAt(i % SIA_SECRET.length) + salt.charCodeAt(i % salt.length)) % 256;
        }
    }
    return key;
  }

  static async baseEncode(input) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let output = '';
    let buffer = 0;
    let bitsLeft = 0;
    for (let i = 0; i < input.length; i++) {
        buffer = (buffer << 8) | input.charCodeAt(i);
        bitsLeft += 8;
        while (bitsLeft >= 5) {output += alphabet[(buffer >> (bitsLeft - 5)) & 31]; bitsLeft -= 5}
    }
    if (bitsLeft > 0) {output += alphabet[(buffer << (5 - bitsLeft)) & 31]}
    return output;
  }

  static async baseDecode(input) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const lookup = {};
    for (let i = 0; i < alphabet.length; i++) {lookup[alphabet[i]] = i}
    let buffer = 0;
    let bitsLeft = 0;
    let output = '';
    for (let i = 0; i < input.length; i++) {
        buffer = (buffer << 5) | lookup[input[i]];
        bitsLeft += 5;
        if (bitsLeft >= 8) {output += String.fromCharCode((buffer >> (bitsLeft - 8)) & 255); bitsLeft -= 8}
    }
    return output;
  }

  static async Hash(text) {
    const salt = await this.getSalt();
    const key = await this.getKey(salt);
    const encoded = String(text).split('').map((char, index) => {
        return String.fromCharCode(char.charCodeAt(0) ^ key[index % key.length]);
    }).join('');
    return await this.baseEncode(salt + encoded);
  }

  static async deHash(hashed) {
    const decoded = await this.baseDecode(hashed);
    const salt = decoded.substring(0, 16);
    const encoded = decoded.substring(16);
    const key = await this.getKey(salt);
    const text = encoded.split('').map((char, index) => {
        return String.fromCharCode(char.charCodeAt(0) ^ key[index % key.length]);
    }).join('');
    return text;
  }
}

// ---------- Telegram Bot ---------- //

class Bot {
  static async handleWebhook(event) {
    if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== BOT_SECRET) {
      return new Response('Unauthorized', { status: 403 })
    }
    const update = await event.request.json()
    event.waitUntil(this.Update(event, update))
    return new Response('Ok')
  }

  static async registerWebhook(event, requestUrl, suffix, secret) {
    const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`
    const response = await fetch(await this.apiUrl('setWebhook', { url: webhookUrl, secret_token: secret }))
    return new Response(JSON.stringify(await response.json()), {headers: HEADERS_ERRR})
  }

  static async unregisterWebhook(event) { 
    const response = await fetch(await this.apiUrl('setWebhook', { url: '' }))
    return new Response(JSON.stringify(await response.json()), {headers: HEADERS_ERRR})
  }

  static async getMe() {
    const response = await fetch(await this.apiUrl('getMe'))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendMessage(chat_id, reply_id, text, reply_markup=[]) {
    const response = await fetch(await this.apiUrl('sendMessage', {chat_id: chat_id, reply_to_message_id: reply_id, parse_mode: 'markdown', text, reply_markup: JSON.stringify({inline_keyboard: reply_markup})}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendDocument(chat_id, file_id) {
    const response = await fetch(await this.apiUrl('sendDocument', {chat_id: chat_id, document: file_id}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async sendPhoto(chat_id, file_id) {
    const response = await fetch(await this.apiUrl('sendPhoto', {chat_id: chat_id, photo: file_id}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async editMessage(channel_id, message_id, caption_text) {
      const response = await fetch(await this.apiUrl('editMessageCaption', {chat_id: channel_id, message_id: message_id, caption: caption_text}))
      if (response.status == 200) {return (await response.json()).result;
      } else {return await response.json()}
  }

  static async answerInlineArticle(query_id, title, description, text, reply_markup=[], id='1') {
    const data = [{type: 'article', id: id, title: title, thumbnail_url: "https://i.ibb.co/5s8hhND/dac5fa134448.png", description: description, input_message_content: {message_text: text, parse_mode: 'markdown'}, reply_markup: {inline_keyboard: reply_markup}}];
    const response = await fetch(await this.apiUrl('answerInlineQuery', {inline_query_id: query_id, results: JSON.stringify(data), cache_time: 1}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async answerInlineDocument(query_id, title, file_id, mime_type, reply_markup=[], id='1') {
    const data = [{type: 'document', id: id, title: title, document_file_id: file_id, mime_type: mime_type, description: mime_type, reply_markup: {inline_keyboard: reply_markup}}];
    const response = await fetch(await this.apiUrl('answerInlineQuery', {inline_query_id: query_id, results: JSON.stringify(data), cache_time: 1}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async answerInlinePhoto(query_id, title, photo_id, reply_markup=[], id='1') {
    const data = [{type: 'photo', id: id, title: title, photo_file_id: photo_id, reply_markup: {inline_keyboard: reply_markup}}];
    const response = await fetch(await this.apiUrl('answerInlineQuery', {inline_query_id: query_id, results: JSON.stringify(data), cache_time: 1}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
  }

  static async getFile(file_id) {
      const response = await fetch(await this.apiUrl('getFile', {file_id: file_id}))
      if (response.status == 200) {return (await response.json()).result;
      } else {return await response.json()}
  }

  static async fetchFile(file_path) {
      const file = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`);
      return await file.arrayBuffer()
  }

  static async apiUrl (methodName, params = null) {
      let query = ''
      if (params) {query = '?' + new URLSearchParams(params).toString()}
      return `https://api.telegram.org/bot${BOT_TOKEN}/${methodName}${query}`
  }

  static async Update(event, update) {
    if (update.inline_query) {await onInline(event, update.inline_query)}
    if ('message' in update) {await onMessage(event, update.message)}
  }
}

// ---------- Inline Listener ---------- // 

async function onInline(event, inline) {
  let  fID; let fName; let fType; let fSize; let fLen;

  if (!PUBLIC_BOT && inline.from.id != BOT_OWNER) {
    const buttons = [[{ text: "Source Code", url: "https://github.com/vauth/filestream-cf" }]];
    return await Bot.answerInlineArticle(inline.id, "Access forbidden", "Deploy your own filestream-cf.", "*❌ Access forbidden.*\n📡 Deploy your own [filestream-cf](https://github.com/vauth/filestream-cf) bot.", buttons)
  }
 
  try {await Cryptic.deHash(inline.query)} catch {
    const buttons = [[{ text: "Source Code", url: "https://github.com/vauth/filestream-cf" }]];
    return await Bot.answerInlineArticle(inline.id, "Error", ERROR_407.description, ERROR_407.description, buttons)
  }

  const channel_id = BOT_CHANNEL;
  const message_id = await Cryptic.deHash(inline.query);
  const data = await Bot.editMessage(channel_id, message_id, await UUID());

  if (data.error_code){
    const buttons = [[{ text: "Source Code", url: "https://github.com/vauth/filestream-cf" }]];
    return await Bot.answerInlineArticle(inline.id, "Error", data.description, data.description, buttons)
  }

  if (data.document){
    fLen = data.document.length - 1
    fID = data.document.file_id;
    fName = data.document.file_name;
    fType = data.document.mime_type;
    fSize = data.document.file_size;
  } else if (data.audio) {
    fLen = data.audio.length - 1
    fID = data.audio.file_id;
    fName = data.audio.file_name;
    fType = data.audio.mime_type;
    fSize = data.audio.file_size;
  } else if (data.video) {
    fLen = data.video.length - 1
    fID = data.video.file_id;
    fName = data.video.file_name;
    fType = data.video.mime_type;
    fSize = data.video.file_size;
  } else if (data.photo) {
    fLen = data.photo.length - 1
    fID = data.photo[fLen].file_id;
    fName = data.photo[fLen].file_unique_id + '.jpg';
    fType = "image/jpg";
    fSize = data.photo[fLen].file_size;
  } else {
    return ERROR_406
  }

  if (fType == "image/jpg") {
    const buttons = [[{ text: "Send Again", switch_inline_query_current_chat: inline.query }]]
    return await Bot.answerInlinePhoto(inline.id, fName || "undefined", fID, buttons)
  } else {
    const buttons = [[{ text: "Send Again", switch_inline_query_current_chat: inline.query }]];
    return await Bot.answerInlineDocument(inline.id, fName || "undefined", fID, fType, buttons)
  }

}

// ---------- Message Listener ---------- // 

async function onMessage(event, message) {
  let fID; let fName; let fSave; let fType;
  let url = new URL(event.request.url);
  let bot = await Bot.getMe();

  if (message.via_bot && message.via_bot.username == bot.username) {
    return
  }

  if (message.chat.id.toString().includes("-100")) {
    return
  }

  if (message.text && message.text.startsWith("/start ")) {
    const file = message.text.split("/start ")[1]
    try {await Cryptic.deHash(file)} catch {return await Bot.sendMessage(message.chat.id, message.message_id, ERROR_407.description)}

    const channel_id = BOT_CHANNEL;
    const message_id = await Cryptic.deHash(file);
    const data = await Bot.editMessage(channel_id, message_id, await UUID());

    if (data.document) {
      fID = data.document.file_id;
      return await Bot.sendDocument(message.chat.id, fID)
    } else if (data.audio) {
      fID = data.audio.file_id;
      return await Bot.sendDocument(message.chat.id, fID)
    } else if (data.video) {
      fID = data.video.file_id;
      return await Bot.sendDocument(message.chat.id, fID)
    } else if (data.photo) {
      fID = data.photo[data.photo.length - 1].file_id;
      return await Bot.sendPhoto(message.chat.id, fID)
    } else {
      return Bot.sendMessage(message.chat.id, message.message_id, "Bad Request: File not found")
    }
  }

  if (!PUBLIC_BOT && message.chat.id != BOT_OWNER) {
    const buttons = [[{ text: "Source Code", url: "https://github.com/vauth/filestream-cf" }]];
    return Bot.sendMessage(message.chat.id, message.message_id, "*❌ Access forbidden.*\n📡 Deploy your own [filestream-cf](https://github.com/vauth/filestream-cf) bot.", buttons)
  }

  if (message.document){
    fID = message.document.file_id;
    fName = message.document.file_name;
    fType = message.document.mime_type.split("/")[0]
    fSave = await Bot.sendDocument(BOT_CHANNEL, fID)
  } else if (message.audio) {
    fID = message.audio.file_id;
    fName = message.audio.file_name;
    fType = message.audio.mime_type.split("/")[0]
    fSave = await Bot.sendDocument(BOT_CHANNEL, fID)
  } else if (message.video) {
    fID = message.video.file_id;
    fName = message.video.file_name;
    fType = message.video.mime_type.split("/")[0]
    fSave = await Bot.sendDocument(BOT_CHANNEL, fID)
  } else if (message.photo) {
    fID = message.photo[message.photo.length - 1].file_id;
    fName = message.photo[message.photo.length - 1].file_unique_id + '.jpg';
    fType = "image/jpg".split("/")[0];
    fSave = await Bot.sendPhoto(BOT_CHANNEL, fID)
  } else {
    const buttons = [[{ text: "Source Code", url: "https://github.com/vauth/filestream-cf" }]];
    return Bot.sendMessage(message.chat.id, message.message_id, "Send me any file/video/gif/audio *(t<=4GB, e<=20MB)*.", buttons)
  }

  if (fSave.error_code) {return Bot.sendMessage(message.chat.id, message.message_id, fSave.description)}

  const final_hash = await Cryptic.Hash(fSave.message_id);
  const final_link = `${url.origin}/?file=${final_hash}`
  const final_stre = `${url.origin}/?file=${final_hash}&mode=inline`
  const final_tele = `https://t.me/${bot.username}/?start=${final_hash}`

  const buttons = [
    [{ text: "Telegram Link", url: final_tele }, { text: "Inline Link", switch_inline_query: final_hash }],
    [{ text: "Stream Link", url: final_stre }, { text: "Download Link", url: final_link }]
  ];

  let final_text = `*🗂 File Name:* \`${fName}\`\n*⚙️ File Hash:* \`${final_hash}\``
  return Bot.sendMessage(message.chat.id, message.message_id, final_text, buttons)
}
