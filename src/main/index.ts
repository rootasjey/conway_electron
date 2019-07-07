'use strict';

/* tslint:disable */
import * as fs                                  from 'fs';
import * as path                                from 'path';
import * as storage                             from 'ya-storage';

import { app, BrowserWindow, Event, ipcMain }   from 'electron';
import { format as formatUrl }                  from 'url';
import { Promise }                              from 'bluebird-lst';

import { born, kill }                           from './algorithms';
import { getAllStates, getInitialSate }         from './dataFallback';
/* tslint:enable */

const isDevelopment = process.env.NODE_ENV !== 'production';

// global reference to mainWindow
// (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | null;

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);

  } else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true,
    }));
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

ipcMain.on('tick', (event: Event, config: GridConfig) => {
  event.sender.send('tick-reply', {
    add     : born(config),
    remove  : kill(config),
    step    : config.step + 1,
  });
});

ipcMain.on('get-initial-state', (event: Event) => {
  const pathName = path.join(__dirname, '/seeds/');

  if (!storage.isPathExists(pathName)) {
    event.sender.send('get-initial-state-reply', getInitialSate());
    return;
  }

  fs.readdir(pathName, (err, files) => {
    if (err) {
      event.sender.send('get-initial-state-reply', getInitialSate());
      return;
    }

    storage.get(`${pathName}${files[0]}`)
      .then((data: Cell[]) => {
        event.sender.send('get-initial-state-reply', data);
      })
      .catch(() => {
        event.sender.send('get-initial-state-reply', getInitialSate());
      });
  });
});

ipcMain.on('get-all-states', (event: Event) => {
  const pathName = path.join(__dirname, '/seeds/');

  if (!storage.isPathExists(pathName)) {
    event.sender.send('get-all-states-reply', getAllStates());
    return;
  }

  fs.readdir(pathName, (err, files) => {

    if (err) {
      event.sender.send('get-all-states-reply', getAllStates());
      return;
    }

    const promArr: any[] = files.map((file) => storage.get(`${pathName}${file}`));

    // files.forEach((file) => { promArr.push(storage.get(`${pathName}${file}`)); });

    Promise.all(promArr)
      .then((states: Cell[][]) => {
        const seeds: NamedState[] = states
          .map((state, i) => ({ name: files[i], state }));

        event.sender.send('get-all-states-reply', seeds);
      })
      .catch(() => {
        event.sender.send('get-all-states-reply', getAllStates());
        return;
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
