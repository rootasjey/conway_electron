'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import * as storage from 'ya-storage'
import * as fs from 'fs'
import { Promise } from 'bluebird-lst';

import { born, kill } from './algo';

const isDevelopment = process.env.NODE_ENV !== 'production';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1400,
    heigt: 900,
  });

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }));
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

ipcMain.on('tick', (event, arg) => {
  event.sender.send('tick-reply', {
    add     : born(arg),
    remove  : kill(arg),
    step    : arg.step + 1
  })
})

ipcMain.on('get-initial-state', (event) => {
  const pathName = path.join(__dirname, '/seeds/');

  fs.readdir(pathName, (err, files) => {
    // TODO: handle error
    // if (err) { }

    storage.get(`${pathName}${files[0]}`)
      .then(data => {
        event.sender.send('get-initial-state-reply', data);
      })
      .catch(() => {
        // TODO: handle error
        // console.error(err);
      });
  });
});

ipcMain.on('get-all-states', (event) => {
  const pathName = path.join(__dirname, '/seeds/');

  fs.readdir(pathName, (err, files) => {

    // if (err) {} // TODO: handle error

    const promArr = [];

    files.forEach(file => { promArr.push(storage.get(`${pathName}${file}`)) });

    Promise.all(promArr)
      .then((states) => {
        const seeds = states.map((state, i) => { return { name: files[i], state } })
        event.sender.send('get-all-states-reply', { seeds });
      })
      .catch(() => { // TODO: handle error
      });
  });
});

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
});
