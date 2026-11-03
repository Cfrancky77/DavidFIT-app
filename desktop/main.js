'use strict';
// Training pour PC : la même appli web que sur Android (dossier ../www), dans une fenêtre.
// Les données (séances, charges, réglages) sont gardées dans ~/.config/training.

const { app, BrowserWindow, Menu, net, protocol, session, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// Dossier de l'appli web : ../www en développement, resources/www une fois empaqueté.
const WWW = app.isPackaged ? path.join(process.resourcesPath, 'www') : path.join(__dirname, '..', 'www');
const HOST = 'training';

app.setPath('userData', path.join(app.getPath('appData'), 'training'));

// Schéma fixe app://training : un stockage local stable, quel que soit le dossier où l'AppImage est montée.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// Sur PC, les mises à jour passent par FCDI Apps : on désactive la vérification intégrée (bandeau APK).
const BRANDING_PATCH = '\nwindow.DESKTOP = true;\nwindow.BRANDING.majDepot = \'\';\n';

function serve(request) {
  const url = new URL(request.url);
  if (url.hostname !== HOST) return new Response('Not found', { status: 404 });
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.normalize(path.join(WWW, rel));
  // Pas de sortie du dossier de l'appli.
  if (file !== WWW && !file.startsWith(WWW + path.sep)) return new Response('Forbidden', { status: 403 });
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return new Response('Not found', { status: 404 });
  if (path.basename(file) === 'branding.js') {
    return new Response(fs.readFileSync(file, 'utf8') + BRANDING_PATCH, {
      headers: { 'content-type': 'text/javascript; charset=utf-8' },
    });
  }
  return net.fetch(pathToFileURL(file).toString());
}

// Google Sheets (programmes du coach) n'autorise pas les requêtes depuis une page locale : on ajoute
// l'en-tête CORS aux seules réponses de Google, comme le fait CapacitorHttp sur Android.
function allowGoogleCors() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    let host = '';
    try { host = new URL(details.url).hostname; } catch (e) { /* ignore */ }
    if (host === 'google.com' || host.endsWith('.google.com') || host.endsWith('.googleusercontent.com')) {
      const headers = { ...details.responseHeaders };
      for (const k of Object.keys(headers)) if (k.toLowerCase() === 'access-control-allow-origin') delete headers[k];
      headers['Access-Control-Allow-Origin'] = ['*'];
      callback({ responseHeaders: headers });
    } else {
      callback({});
    }
  });
}

const stateFile = () => path.join(app.getPath('userData'), 'window.json');
function loadBounds() {
  try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch (e) { return {}; }
}

function createWindow() {
  const saved = loadBounds();
  const win = new BrowserWindow({
    width: saved.width || 520,
    height: saved.height || 900,
    x: saved.x,
    y: saved.y,
    minWidth: 360,
    minHeight: 560,
    title: 'Training',
    backgroundColor: '#14171c',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: false },
  });
  win.removeMenu();
  win.on('close', () => {
    try { fs.writeFileSync(stateFile(), JSON.stringify(win.getNormalBounds())); } catch (e) { /* ignore */ }
  });
  // Liens externes : dans le navigateur, jamais dans la fenêtre.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?:|mailto:|tel:)/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`app://${HOST}/`)) {
      event.preventDefault();
      if (/^(https?:|mailto:|tel:)/.test(url)) shell.openExternal(url);
    }
  });
  win.loadURL(`app://${HOST}/index.html`);
  return win;
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    protocol.handle('app', serve);
    allowGoogleCors();
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
