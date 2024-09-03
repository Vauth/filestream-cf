// ---------- Insert Your Data ---------- //

const BOT_TOKEN = "BOT_TOKEN"; // Insert your bot token.
const BOT_WEBHOOK = "/endpoint"; // Let it be as it is.
const BOT_SECRET = "BOT_SECRET"; // Insert a powerful secret text.
const BOT_OWNER = 123456789; // Insert your telegram account id.
const BOT_CHANNEL = -100123456789; // Insert your telegram channel id which the bot is admin in.

// ---------- Do Not Modify ---------- // 

const WHITE_METHODS = ["GET", "POST", "HEAD"];
const HEADERS_FILE = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"};
const HEADERS_ERRR = {'Access-Control-Allow-Origin': '*', 'content-type': 'application/json'};
const ERROR_404 = {"ok":false,"error_code":404,"description":"Bad Request: missing /?file= parameter", "credit": "https://github.com/vauth/filestream-cf"};
const ERROR_405 = {"ok":false,"error_code":405,"description":"Bad Request: method not allowed"};
const ERROR_406 = {"ok":false,"error_code":406,"description":"Bad Request: file type invalid"};
const ERROR_407 = {"ok":false,"error_code":407,"description":"Bad Request: file hash invalid by atob"};

// ---------- Event Listener ---------- // 

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event))
});

async function handleRequest(event) {
    const url = new URL(event.request.url);
    const file = url.searchParams.get('file');
    
    if (url.pathname === BOT_WEBHOOK) {return handleWebhook(event)}
    if (url.pathname === '/registerWebhook') {return registerWebhook(event, url, BOT_WEBHOOK, BOT_SECRET)}
    if (url.pathname === '/unregisterWebhook') {return unregisterWebhook(event)}

    if (!file) {return Raise(ERROR_404, 404);}
    if (!WHITE_METHODS.includes(event.request.method)) {return Raise(ERROR_405, 405);}
    try {atob(file)} catch {return Raise(ERROR_407, 407)}

    const file_path = atob(file)
    const channel_id = file_path.split('/')[0]
    const file_id = file_path.split('/')[1]
    const retrieve = await RetrieveFile(channel_id, file_id);
    if (retrieve.error_code) {return await Raise(retrieve, retrieve.error_code)};

    const rdata = retrieve[0]
    const rname = retrieve[1]
    const rsize = retrieve[2]

    return new Response(rdata, {
        status: 200, headers: {
            "Content-Disposition": `attachment; filename=${rname}`,
            "Content-Length": rsize,
            ...HEADERS_FILE
        }
    });
}

// ---------- Retrieve File ---------- //

async function RetrieveFile(channel_id, message_id) {
    let  fID; let fName; let fSize; let fLen;
    let data = await editMessage(channel_id, message_id, await UUID());
    if (data.error_code){return data}
    
    if (data.document){
        fLen = data.document.length - 1
        fID = data.document.file_id;
        fName = data.document.file_name;
        fSize = data.document.file_size;
    } else if (data.audio) {
        fLen = data.audio.length - 1
        fID = data.audio.file_id;
        fName = data.audio.file_name;
        fSize = data.audio.file_size;
    } else if (data.video) {
        fLen = data.video.length - 1
        fID = data.video.file_id;
        fName = data.video.file_name;
        fSize = data.video.file_size;
    } else if (data.photo) {
        fLen = data.photo.length - 1
        fID = data.photo[fLen].file_id;
        fName = data.photo[fLen].file_unique_id + '.jpg';
        fSize = data.photo[fLen].file_size;
    } else {
        return ERROR_406
    }

    return [await fetchFile((await getFile(fID)).file_path), fName, fSize];
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

// ---------- Telegram Webhook ---------- // 
async function handleWebhook(event) {
  if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== BOT_SECRET) {
    return new Response('Unauthorized', { status: 403 })
  }
  const update = await event.request.json()
  event.waitUntil(onUpdate(event, update))
  return new Response('Ok')
}

async function registerWebhook(event, requestUrl, suffix, secret) {
  const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`
  const response = await fetch(apiUrl('setWebhook', { url: webhookUrl, secret_token: secret }))
  return new Response(JSON.stringify(await response.json()), {headers: HEADERS_ERRR})
}

async function unregisterWebhook(event) { 
  const response = await fetch(apiUrl('setWebhook', { url: '' }))
  return new Response(JSON.stringify(await response.json()), {headers: HEADERS_ERRR})
}

// ---------- Telegram API ---------- //

async function sendMessage(chat_id, reply_id, text) {
  const response = await fetch(apiUrl('sendMessage', {chat_id: chat_id, reply_to_message_id: reply_id, parse_mode: 'markdown', text}))
  if (response.status == 200) {return (await response.json()).result;
  } else {return await response.json()}
}

async function sendDocument(chat_id, file_id) {
  const response = await fetch(apiUrl('sendDocument', {chat_id: chat_id, document: file_id}))
  if (response.status == 200) {return (await response.json()).result;
  } else {return await response.json()}
}

async function sendPhoto(chat_id, file_id) {
  const response = await fetch(apiUrl('sendPhoto', {chat_id: chat_id, photo: file_id}))
  if (response.status == 200) {return (await response.json()).result;
  } else {return await response.json()}
}

async function editMessage(channel_id, message_id, caption_text) {
    const response = await fetch(apiUrl('editMessageCaption', {chat_id: channel_id, message_id: message_id, caption: caption_text}))
    if (response.status == 200) {return (await response.json()).result;
    } else {return await response.json()}
}

async function getFile(file_id) {
    const response = await fetch(apiUrl('getFile', {file_id: file_id}))
    return (await response.json()).result;
}

async function fetchFile(file_path) {
    const file = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`);
    return await file.arrayBuffer()
}

function apiUrl (methodName, params = null) {
    let query = ''
    if (params) {query = '?' + new URLSearchParams(params).toString()}
    return `https://api.telegram.org/bot${BOT_TOKEN}/${methodName}${query}`
}


// ---------- Message Listener ---------- // 

async function onUpdate(event, update) {
  if ('message' in update) {await onMessage(event, update.message)}
}

async function onMessage(event, message) {
  let fID; let fName; let fSave;
  let url = new URL(event.request.url);

  if (message.chat.id != BOT_OWNER) {
    return sendMessage(message.chat.id, message.message_id, "Access forbidden.\nDeploy your own bot: https://github.com/vauth/filestream-cf")
  }

  if (message.document){
    fID = message.document.file_id;
    fName = message.document.file_name;
    fSave = await sendDocument(BOT_CHANNEL, fID)
  } else if (message.audio) {
    fID = message.audio.file_id;
    fName = message.audio.file_name;
    fSave = await sendDocument(BOT_CHANNEL, fID)
  } else if (message.video) {
    fID = message.video.file_id;
    fName = message.video.file_name;
    fSave = await sendDocument(BOT_CHANNEL, fID)
  } else if (message.photo) {
    fID = message.photo[message.photo.length - 1].file_id;
    fName = message.photo[message.photo.length - 1].file_unique_id + '.jpg';
    fSave = await sendPhoto(BOT_CHANNEL, fID)
  } else {
    return sendMessage(message.chat.id, message.message_id, "Send me any file/video/gif/audio")
  }

  if (fSave.error_code) {return sendMessage(message.chat.id, message.message_id, fSave.description)}

  const final_hash = (btoa(fSave.chat.id + "/" + fSave.message_id)).replace('=', '')
  const final_link = `${url.origin}/?file=${final_hash}`
  const final_text = `*File Name:* \`${fName}\`\n*File Hash:* \`${final_hash}\`\n*Download Link:* ${final_link}`
  
  return sendMessage(message.chat.id, message.message_id, final_text) 
}