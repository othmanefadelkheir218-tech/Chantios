const https = require('https');
const fs = require('fs');
const path = require('path');

// Secrets come from .env (git-ignored): TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
require('dotenv').config({ path: path.join(__dirname, '.env') });

const BOT_TOKEN       = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID);
if (!BOT_TOKEN || !ALLOWED_CHAT_ID) {
  console.error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in .env');
  process.exit(1);
}
const PROJECT_DIR     = __dirname;
const INBOX           = path.join(PROJECT_DIR, 'inbox.json');
const OUTBOX          = path.join(PROJECT_DIR, 'outbox.json');
const PUSH            = path.join(PROJECT_DIR, 'push.json');

let lastUpdateId = 0;
let waitingForReply = false;

function telegramRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(params);
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendMessage(chatId, text) {
  const chunks = [];
  while (text.length > 4000) { chunks.push(text.slice(0, 4000)); text = text.slice(4000); }
  if (text.length > 0) chunks.push(text);
  for (const chunk of chunks) {
    await telegramRequest('sendMessage', { chat_id: chatId, text: chunk }).catch(() => {});
  }
}

// Write incoming message to inbox.json
function writeInbox(chatId, message) {
  fs.writeFileSync(INBOX, JSON.stringify({ chatId, message }, null, 2));
}

// Watch outbox.json for Claude's reply
function watchOutbox(chatId) {
  // Reset outbox first
  fs.writeFileSync(OUTBOX, JSON.stringify({ status: 'empty' }, null, 2));

  let timeout;

  const watcher = fs.watch(OUTBOX, async () => {
    try {
      const raw = fs.readFileSync(OUTBOX, 'utf8');
      const data = JSON.parse(raw);
      if (data.status === 'ready' && data.reply) {
        clearTimeout(timeout);
        watcher.close();
        waitingForReply = false;
        await sendMessage(chatId, data.reply);
        // Reset outbox
        fs.writeFileSync(OUTBOX, JSON.stringify({ status: 'empty' }, null, 2));
        console.log(`[${new Date().toLocaleTimeString()}] Reply sent.`);
      }
    } catch {}
  });

  // Timeout after 5 minutes
  timeout = setTimeout(() => {
    watcher.close();
    waitingForReply = false;
    sendMessage(chatId, 'Timeout — no reply received.');
  }, 300000);
}

// Always-open channel: Claude pushes a message without being asked
function watchPush() {
  let timer = null;
  fs.watch(PUSH, () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const data = JSON.parse(fs.readFileSync(PUSH, 'utf8'));
        if (!data.message) return;
        fs.writeFileSync(PUSH, JSON.stringify({}, null, 2));
        await sendMessage(ALLOWED_CHAT_ID, data.message);
        console.log(`[${new Date().toLocaleTimeString()}] Push sent.`);
      } catch {}
    }, 100);
  });
}

async function poll() {
  try {
    const result = await telegramRequest('getUpdates', {
      offset: lastUpdateId + 1, timeout: 30, allowed_updates: ['message'],
    });

    if (result.ok && result.result && result.result.length > 0) {
      for (const update of result.result) {
        lastUpdateId = update.update_id;
        const msg = update.message;
        if (!msg || !msg.text) continue;

        if (msg.chat.id !== ALLOWED_CHAT_ID) {
          await sendMessage(msg.chat.id, 'Access denied.');
          continue;
        }

        if (waitingForReply) {
          await sendMessage(msg.chat.id, 'Still waiting for a reply, please wait...');
          continue;
        }

        console.log(`[${new Date().toLocaleTimeString()}] You: ${msg.text}`);
        await sendMessage(msg.chat.id, 'Message received. Waiting for Claude...');

        waitingForReply = true;
        writeInbox(msg.chat.id, msg.text);
        watchOutbox(msg.chat.id);
      }
    }
  } catch (e) { console.error('Poll error:', e.message); }

  setTimeout(poll, 2000);
}

// Init files
if (!fs.existsSync(INBOX))  fs.writeFileSync(INBOX,  JSON.stringify({ status: 'empty' }, null, 2));
if (!fs.existsSync(OUTBOX)) fs.writeFileSync(OUTBOX, JSON.stringify({ status: 'empty' }, null, 2));
if (!fs.existsSync(PUSH))   fs.writeFileSync(PUSH,   JSON.stringify({}, null, 2));

console.log('=== ChantierOS Telegram Bot ===');
console.log('Messages → inbox.json | Replies ← outbox.json | Push → push.json');
console.log('Waiting for messages...\n');
watchPush();
poll();
