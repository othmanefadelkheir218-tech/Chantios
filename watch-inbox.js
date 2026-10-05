const fs = require('fs');
const path = require('path');

const INBOX = path.join(__dirname, 'inbox.json');

if (!fs.existsSync(INBOX)) {
  fs.writeFileSync(INBOX, JSON.stringify({}, null, 2));
}

let timer = null;

fs.watch(INBOX, () => {
  // fs.watch can fire twice for one write — collapse into one read
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      const data = JSON.parse(fs.readFileSync(INBOX, 'utf8'));
      if (data.message) console.log('NEW_MESSAGE: ' + data.message);
    } catch {}
  }, 100);
});
