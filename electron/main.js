const { app, BrowserWindow, protocol, net, Menu, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// بروتوكول app:// يُعامل كسياق آمن (Secure Context): يدعم التشفير وlocalStorage وIndexedDB وWebAuthn
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

const WWW = path.join(__dirname, '..', 'www');
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1366, height: 860, minWidth: 900, minHeight: 600,
    title: 'MMY.YE',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    backgroundColor: '#060A07',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  Menu.setApplicationMenu(null);
  win.loadURL('app://mmy/index.html');
  // الروابط الخارجية تُفتح في المتصفح وليس داخل البرنامج
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const u = new URL(req.url);
    let rel = decodeURIComponent(u.pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    const file = path.normalize(path.join(WWW, rel));
    if (!file.startsWith(WWW)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString()).then((res) => {
      // نوع MIME صريح كي تُحمَّل وحدات JavaScript (عارض PDF) بشكل صحيح عبر بروتوكول app://
      const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.wasm': 'application/wasm' };
      const t = types[path.extname(file).toLowerCase()];
      if (!t) return res;
      const h = new Headers(res.headers); h.set('content-type', t);
      return new Response(res.body, { status: res.status, headers: h });
    });
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

// نسخة واحدة فقط من البرنامج
if (!app.requestSingleInstanceLock()) app.quit();
else app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
