import 'phaser';

import { ipcRenderer } from 'electron';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });

    this.config = {
      cellSize: { h: 0, w: 0 },
      colors: {
        cellBorder: 0x78e08f,
        cell: 0xb8e994,
        editionMode: { add: 0xb8e994, remove: 0xED4C67 },
        grid: 0xecf0f1,
      },
      dimensions: {
        columns: 80,
        rows: 40,
      },
    };
  }

  init() {
    this.state = {
      cells: {},
      paused: true,
      ready: false,
      step: 0,
    };

    this.timer = undefined;

    this.ui = {
      buttons: {
        editionMode: {},
        pause: {},
        play: {},
        restart: {},
        seeds: {},
      },
      cells: {},
      counter: {},
      editionMode: 'add',
      pointer: {},
      seedsPanel: {},
    };

    return this;
  }

  cleanBoard() {
    for (const [, cell] of Object.entries(this.ui.cells)) {
      cell.destroy();
    }

    return this;
  }

  create() {
    const { columns, rows } = this.config.dimensions;

    this.createGrid({ columns, rows, debug: true })
      .createInitialState()
      .createCounter()
      .createUIControls()
      .createPointer()
      .listenEvents();
  }

  createBoard(config = {}) {
    const { data, i, seedsPanel, state } = config;
    const seedsBoards = seedsPanel.last;

    const color = 0xED4C67;
    const width = 150;
    const x = (width + 40) * i + width;
    const y = 110;

    const rect = this.add
      .rectangle(x, y, width, width, color)
      .setInteractive();

    rect.on('pointerover', () => {
      rect.setScale(1.2, 1.2);
    });

    rect.on('pointerout', () => {
      rect.setScale(1, 1);
    });

    rect.on('pointerdown', () => {
      this
        .cleanBoard()
        .initCells(state);

      seedsPanel.setVisible(false);
      seedsBoards.removeAll(true);
      this.state.ready = true;
    });

    let name = data.names[i].replace('.json', '');
    name = name.length > 10 ? name.substring(0, 10) + '...' : name;

    const textX = (width + 40) * i + (width / 2);
    const textY = width + 60;
    const style = { fontFamily: 'Arial', fontSize: 20, color: '#fff' };

    const text = this.add.text(textX, textY, `${name}`, style)

    seedsBoards.add(rect).add(text);
  }

  createCounter() {
    const { step } = this.state;
    const x = 30;
    const y = window.innerHeight - 70;
    const style = { fontFamily: 'Arial', fontSize: 64, color: '#fbc531' };

    this.ui.counter = this.add
      .text(x, y, `${step}`, style)
      .setInteractive()
      .setAlpha(.6)
      .setDepth(2);

    const { counter } = this.ui;

    counter.on('pointerover', () => {
      counter.setAlpha(1);
    });

    counter.on('pointerout', () => {
      counter.setAlpha(.6);
    });

    return this;
  }

  createEditionModeButton() {
    const { innerWidth: x } = window;
    const y = 190;
    const color = 0xFFC312;

    const r1 = this.add.rectangle(0, 0, 10, 50, color);
    const r2 = this.add.rectangle(0, 0, 50, 10, color);

    this.ui.buttons.editionMode = this.add
      .container(x - 50, y, [r1, r2])
      .setSize(50, 100)
      .setInteractive()
      .setAlpha(.8)
      .setDepth(2);

    // Events
    const { editionMode } = this.ui.buttons;

    editionMode.once('destroy', () => {
      r1.destroy();
      r2.destroy();
    });

    editionMode.on('pointerdown', () => {
      const { paused, ready } = this.state;

      if (!ready) { return; }

      if (paused) {
        const { add: colorAdd, remove: colorRemove }
          = this.config.colors.editionMode;

        this.ui.editionMode = this.ui.editionMode === 'add' ?
          'remove' : 'add';

        if (this.ui.editionMode === 'add') {
          r1.setVisible(true);
          this.ui.pointer.setFillStyle(colorAdd);

        } else {
          r1.setVisible(false);
          this.ui.pointer.setFillStyle(colorRemove);
        }
      }
    });

    editionMode.on('pointerover', () => {
      editionMode.setAlpha(1);
    });

    editionMode.on('pointerout', () => {
      editionMode.setAlpha(.8);
    });

    return this;
  }

  createGrid({ columns = 80, rows = 40, debug = false }) {
    const { grid: color } = this.config.colors;

    const rowSize = window.innerHeight / rows;
    const columnSize = window.innerWidth / columns;

    const columnHeight = window.innerHeight * 2;
    const rowWidth = window.innerWidth * 2;

    this.config.cellSize = { h: rowSize, w: columnSize };

    if (debug) {
      for (let index = 0; index < columns; index++) {
        const columnOffset = columnSize * index;
        this.add.line(0, 0, columnOffset, 0, columnOffset, columnHeight, color);
      }

      for (let index = 0; index < rows; index++) {
        const rowOffset = rowSize * index;
        this.add.line(0, 0, 0, rowOffset, rowWidth, rowOffset, color);
      }
    }

    return this;
  }

  createInitialState() {
    ipcRenderer.send('get-initial-state');

    ipcRenderer.on('get-initial-state-reply', (event, data) => {
      this.initCells(data);
    });

    return this;
  }

  createPauseButton() {
    const { innerWidth: x } = window;
    const y = 40;

    // Pause button
    const r1 = this.add.rectangle(0, 0, 10, 50, 0x6666ff);
    const r2 = this.add.rectangle(20, 0, 10, 50, 0x6666ff);

    this.ui.buttons.pause = this.add
      .container(x - 60, y, [r1, r2])
      .setSize(50, 100)
      .setInteractive()
      .setAlpha(.8)
      .setVisible(false)
      .setDepth(2);

    // Events
    const { pause } = this.ui.buttons;

    pause.once('destroy', () => {
      r1.destroy();
      r2.destroy();
    });

    pause.on('pointerdown', () => {
      if (!this.state.ready) { return; }

      const { paused } = this.state;
      const { play } = this.ui.buttons;

      if (!paused) {
        this.pause();
        play.setVisible(true);
        pause.setVisible(false);
      }
    });

    pause.on('pointerover', () => {
      pause.setAlpha(1);
    });

    pause.on('pointerout', () => {
      pause.setAlpha(.8);
    });

    return this;
  }

  createPlayButton() {
    const { innerWidth: x } = window;
    const y = 40;

    // Play button
    this.ui.buttons.play = this.add.triangle(
      x - 45, y, 0, 0, 0, 45, 45, 22.5, 0xe84118)
      .setInteractive()
      .setAlpha(.8)
      .setDepth(2);

    // Events
    const { play, pause } = this.ui.buttons;

    play.on('pointerdown', () => {
      const { paused, ready } = this.state;

      if (!ready) { return; }

      if (paused) {
        this.start();

        play.setVisible(false);
        pause.setVisible(true);
      }
    })

    play.on('pointerover', () => {
      play.setAlpha(1);
    });

    play.on('pointerout', () => {
      play.setAlpha(.8);
    });

    return this;
  }

  createPointer() {
    const { h, w } = this.config.cellSize;
    const { cell: color } = this.config.colors;

    this.ui.pointer = this.add.rectangle(100, 20, w, h, color)
      .setVisible(false)
      .setDepth(1);

    return this;
  }

  createRestartButton() {
    const { innerWidth: x } = window;
    const y = 40;

    const circle = this.add.circle(0, 10, 20)
      .setStrokeStyle(10, 0x00a8ff);

    const triangle = this.add.triangle(
      -17, 5, 0, 0, 0, 30, 30, 8, 0x00a8ff)
      .setRotation(39);

    this.ui.buttons.restart = this.add
      .container(
        x - 45,
        y + 60,
        [circle, triangle]
      )
      .setSize(50, 60)
      .setInteractive()
      .setAlpha(.8)
      .setDepth(2);

    // Events
    const { restart } = this.ui.buttons;

    restart.once('destroy', () => {
      circle.destroy()
      triangle.destroy();
    });

    restart.on('pointerup', (pointer, x, y, options) => {
      if (!this.state.ready) { return; }

      this.restart()
      options.stopPropagation()
    });

    restart.on('pointerover', () => {
      restart.setAlpha(1)
    });

    restart.on('pointerout', () => {
      restart.setAlpha(.8)
    });

    return this;
  }

  createSeedsButton() {
    const { innerWidth: x, innerHeight: y } = window;
    const color = 0xA3CB38;
    const borderColor = 0x009432;
    const w = 70;
    const h = 30;

    const textX = -w;
    const textY = 20 - h;
    const style = { fontFamily: 'Arial', fontSize: 20, color: '#009432' };

    const r1 = this.add
      .rectangle((w / 2) - (w + 10), 0, w, h, color)
      .setStrokeStyle(4, borderColor);

    const text = this.add
      .text(textX, textY, 'seeds', style)
      .setDepth(1);

    this.ui.buttons.seeds = this.add
      .container((x - 10), y - h, [r1, text])
      .setSize(w * 2, h * 2)
      .setInteractive()
      .setDepth(4);

    const { seeds: buttonSeed } = this.ui.buttons;

    // Events
    buttonSeed.once('destroy', () => {
      r1.destroy();
      text.destroy();
    });

    buttonSeed.on('pointerdown', () => {
      this.toggleSeedsPanel();
    });

    buttonSeed.on('pointerover', () => {
      buttonSeed.setScale(1.1, 1.1);
    });

    buttonSeed.on('pointerout', () => {
      buttonSeed.setScale(1, 1);
    });
  }

  createSeedsPanel() {
    const { innerHeight: h, innerWidth: w } = window;

    const borderColor = 0x1B1464;
    const color = 0xb2bec3;
    const x = w / 2;
    const y = h / 2;

    const textX = w / 2;
    const textY = 10;
    const style = { fontFamily: 'Arial', fontSize: 40, color: '#fff' };

    const background = this.add
      .rectangle(x, y, w, h, color)
      .setStrokeStyle(5, borderColor);

    const text = this.add.text(textX, textY, 'seeds', style);

    const seedsBoards = this.add.container(0, 90);

    this.ui.seedsPanel = this.add
      .container(0, 0, [background, text, seedsBoards])
      .setVisible(false)
      .setDepth(3);

    return this.ui.seedsPanel;
  }

  createUIControls() {
    this
      .createPauseButton()
      .createPlayButton()
      .createRestartButton()
      .createEditionModeButton()
      .createSeedsButton();

    return this;
  }

  freeMemory() {
    for (const [, button] of Object.entries(this.ui.buttons)) {
      button.destroy();
    }

    this.cleanBoard();

    this.ui.counter.destroy();
    this.ui.pointer.destroy();

    this.ui.pointer = undefined;

    window.clearInterval(this.timer);

    ipcRenderer.removeAllListeners('tick-reply');
    ipcRenderer.removeAllListeners('get-initial-state-reply');
    this.input.removeAllListeners('pointermove');
    this.input.removeAllListeners('pointerup');

    return this;
  }

  /**
   * Draw cells
   */
  initCells(seed) {
    const { h, w } = this.config.cellSize;
    const { cells } = this.state;
    const { cells: visualCells } = this.ui;
    const { cell: color } = this.config.colors;

    seed.map((cell) => {
      const rect = this.add.rectangle(
        (cell.x + .5) * w,
        (cell.y + .5) * h,
        w, h,
        color
       );

      const key = `${cell.x},${cell.y}`;

      visualCells[key] = rect;
      cells[key] = cell;
    });

    this.state.ready = true;
  }

  listenEvents() {
    ipcRenderer.on('tick-reply', (event, data) => {
      this.renderState(data);
    })

    // TODO: Create dedicated container for board
    this.input.on('pointermove', (pointer) => {
      const { paused, ready } = this.state;
      if (!paused || !ready) { return; }

      const { x, y } = pointer;
      const { h, w } = this.config.cellSize;

      if (!this.ui.pointer.visible) {
        this.ui.pointer.setVisible(true);
      }

      const cellX = Math.floor(x / w);
      const cellY = Math.floor(y / h);

      const newX = (cellX + .5) * w;
      const newY = (cellY + .5) * h;

      this.ui.pointer.x = newX;
      this.ui.pointer.y = newY;

      const { cell: color } = this.config.colors;

      const key = `${cellX},${cellY}`;

      if (pointer.isDown) {
        const { cells: visualCells, editionMode } = this.ui;
        const { cells } = this.state;

        if (editionMode === 'add') {
          if (cells[key]) { return; }

          visualCells[key] = this.add.rectangle(newX, newY, w, h, color);
          cells[key] = { x: cellX, y: cellY };

        } else {
          if (!cells[key]) { return; }

          visualCells[key].destroy();
          cells[key] = undefined;

          delete visualCells[key];
          delete cells[key];
        }
      }
    })

    this.input.on('pointerup', () => {
      const { paused, ready } = this.state;
      if (!paused || !ready) { return; }

      const { cells } = this.state
      const { cells: visualCells, editionMode } = this.ui

      const { h, w } = this.config.cellSize
      const { cell: color } = this.config.colors
      const { x, y } = this.ui.pointer


      const cellX = Math.round((x / w) - .5)
      const cellY = Math.round((y / h) - .5)


      const key = `${cellX},${cellY}`

      if (editionMode === 'add') {
        if (cells[key]) { return; }

        visualCells[key] = this.add.rectangle(x, y, w, h, color)
        cells[key] = { x: cellX, y: cellY }

      } else {
        if (!cells[key]) { return; }

        visualCells[key].destroy()
        cells[key] = undefined

        delete visualCells[key]
        delete cells[key]
      }
    })

    return this
  }

  pause() {
    window.clearInterval(this.timer);
    this.state.paused = true;

    return this;
  }

  renderState(state = {}) {
    const { add, remove } = state;
    const { h, w } = this.config.cellSize;

    const { cells } = this.state;
    const { cells: visualCells } = this.ui;
    const { cell: color } = this.config.colors;

    this.state.step = state.step;
    this.updateCounter(state.step);

    for (const [key, cell] of Object.entries(add)) {
      const rect = this.add.rectangle((cell.x + .5) * w, (cell.y + .5) * h, w, h, color);
      visualCells[key] = rect;
      cells[key] = cell;
    }

    for (const [key] of Object.entries(remove)) {
      if (!cells[key]) return;

      cells[key] = undefined;

      visualCells[key].destroy();
      visualCells[key] = undefined;

      delete visualCells[key];
      delete cells[key];
    }
  }

  restart() {
    this.freeMemory()
      .init()
      .create();
  }

  start() {
    this.timer = window.setInterval(() => { this.tick() }, 1000);
    this.state.paused = false;
    this.ui.pointer.setVisible(false);

    return this;
  }

  stopTick() {
    const { pause } = this.ui.buttons;

    pause.setVisible(false);
    window.clearInterval(this.timer);
  }

  tick() {
    const { cells, step } = this.state;
    const { columns, rows } = this.config.dimensions;

    if (Object.keys(cells).length < 1) {
      this.stopTick();
    }

    ipcRenderer.send('tick', { cells, columns, rows, step });
  }

  toggleSeedsPanel() {
    let { seedsPanel } = this.ui;

    if (!seedsPanel.setVisible) {
      seedsPanel = this.createSeedsPanel();
    }

    if (seedsPanel.visible) {
      seedsPanel.setVisible(false);
      this.state.ready = true;

      const seedsBoards = seedsPanel.last;
      seedsBoards.removeAll(true);

      return;
    }

    seedsPanel.setVisible(true);
    this.state.ready = false;

    ipcRenderer.once('get-all-states-reply', (event, data) => {
      data.states
        .map((state, i) => {
          this.createBoard({ data, i, seedsPanel, state })
        })
    });

    ipcRenderer.send('get-all-states');
  }

  updateCounter(text) {
    // Used to update interactive zone
    if (this.ui.counter.text.length !== `${text}`.length) {
      this.ui.counter.destroy();
      this.createCounter();
      return;
    }

    this.ui.counter.text = text;
  }
}
