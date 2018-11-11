import 'phaser';

import { Event, ipcRenderer } from 'electron';

import defaultConfig from './defaultConfig.json';

export default class MainScene extends Phaser.Scene {
  private config: BoardConfig = defaultConfig;

  private state: BoardState = {
    cells: {},
    paused: true,
    ready: false,
    step: 0,
  };

  /**
   * Simulation elapsing time in ms.
   */
  private timer: number | undefined;

  private ui: GameUI = {
    buttons: {
      editionMode: undefined,
      pause: undefined,
      play: undefined,
      restart: undefined,
      seeds: undefined,
    },
    cells: {},
    counter: undefined,
    editionMode: 'add',
    lines: [],
    pointer: undefined,
    seedsPanel: undefined,
  };

  constructor() {
    super({ key: 'MainScene' });
  }

  public cleanBoard() {
    const cells = this.state.cells;
    const visualCells: VisualCellMap = this.ui.cells;

    for (const [key, cell] of Object.entries(visualCells)) {
      cell.destroy();
      delete visualCells[key];
    }

    for (const [key] of Object.entries(cells)) {
      delete cells[key];
    }

    return this;
  }

  public create(config: State) {
    const { columns, rows } = this.config.dimensions;

    this.createGrid({ columns, rows, debug: true })
      .createCounter()
      .createInitialState(config)
      .createUIControls()
      .createPointer()
      .listenEvents();
  }

  public createBoard(config: BoardSeedConfig) {
    const { i, name, seedsPanel, state }  = config;
    const { innerWidth: panelWidth }      = window;

    const seedsBoards = seedsPanel.last as Phaser.GameObjects.Container;

    const rectColor   = 0xED4C67;
    const rectMargin  = 40;
    const rectWidth   = 150;

    const rectPerLine = Math.floor(panelWidth / (rectWidth + rectMargin)) - 1;

    const rectX = (rectWidth + rectMargin) * (i % rectPerLine) + rectWidth;
    const rectY = 100 + (200 * Math.floor(i / rectPerLine));

    const maxStrLength = 20;

    let boardName = name.replace('.json', '');

    boardName = boardName.length > maxStrLength ?
      boardName.substring(0, maxStrLength) + '...' : boardName;

    const style = { fontFamily: 'Arial', fontSize: 20, color: '#fff' };
    const textX = rectX - (rectWidth / 2);
    const textY = rectY + (rectWidth / 1.75);

    const text = this.add.text(textX, textY, `${boardName}`, style);

    const rect = this.add
      .rectangle(rectX, rectY, rectWidth, rectWidth, rectColor)
      .setInteractive();

    rect
      .on('pointerover', () => {
        rect.setScale(1.2, 1.2);
      })
      .on('pointerout', () => {
        rect.setScale(1, 1);
      })
      .on('pointerdown', () => {
        this
          .cleanBoard()
          .initCells(state);

        seedsPanel.setVisible(false);
        seedsBoards.removeAll(true);
        this.state.ready = true;
      });

    seedsBoards
      .add(rect)
      .add(text);
  }

  public createCounter() {
    const { step } = this.state;
    const x = 30;
    const y = window.innerHeight - 70;
    const style = { fontFamily: 'Arial', fontSize: 64, color: '#fbc531' };

    this.ui.counter = this.add
      .text(x, y, `${step}`, style);

    return this;
  }

  public createEditionModeButton() {
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
        const pointer = this.ui.pointer as Phaser.GameObjects.Rectangle;

        const { add: colorAdd, remove: colorRemove }
          = this.config.colors.editionMode;

        this.ui.editionMode = this.ui.editionMode === 'add' ?
          'remove' : 'add';

        if (this.ui.editionMode === 'add') {
          r1.setVisible(true);
          pointer.setFillStyle(parseInt(colorAdd, 16));

        } else {
          r1.setVisible(false);
          pointer.setFillStyle(parseInt(colorRemove, 16));
        }
      }
    });

    editionMode
      .on('pointerover', () => {
        editionMode.setAlpha(1);
      })
      .on('pointerout', () => {
        editionMode.setAlpha(.8);
      });

    return this;
  }

  public createGrid({ columns = 80, rows = 40, debug = false }) {
    const color = parseInt(this.config.colors.grid, 16);

    const rowSize         = window.innerHeight / rows;
    const columnSize      = window.innerWidth / columns;

    const columnHeight    = window.innerHeight * 2;
    const rowWidth        = window.innerWidth * 2;

    this.config.cellSize  = { h: rowSize, w: columnSize };

    if (debug) {
      for (let index = 0; index < columns; index++) {
        const columnOffset = columnSize * index;
        const line = this.add.line(0, 0, columnOffset, 0, columnOffset, columnHeight, color);

        this.ui.lines.push(line);
      }

      for (let index = 0; index < rows; index++) {
        const rowOffset = rowSize * index;
        const line = this.add.line(0, 0, 0, rowOffset, rowWidth, rowOffset, color);

        this.ui.lines.push(line);
      }
    }

    return this;
  }

  public createInitialState(config: State) {
    if (config.add && Object.keys(config.add).length > 0) {
      this.renderState(config);
      this.state.ready = true;
      return this;
    }

    ipcRenderer.send('get-initial-state', config);

    ipcRenderer.on('get-initial-state-reply', (event: Event, data: Cell[]) => {
      this.initCells(data);
    });

    return this;
  }

  public createPauseButton() {
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

      const { paused }  = this.state;
      const { play }    = this.ui.buttons;

      if (!paused) {
        this.pause();
        pause.setVisible(false);

        if (play) { play.setVisible(true); }
      }
    });

    pause
      .on('pointerover', () => {
        pause.setAlpha(1);
      })
      .on('pointerout', () => {
        pause.setAlpha(.8);
      });

    return this;
  }

  public createPlayButton() {
    const { innerWidth: x } = window;
    const y = 40;

    this.ui.buttons.play = this.add
      .triangle(x - 45, y, 0, 0, 0, 45, 45, 22.5, 0xe84118)
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
        if (pause) { pause.setVisible(true); }
      }
    });

    play
      .on('pointerover', () => {
        play.setAlpha(1);
      })
      .on('pointerout', () => {
        play.setAlpha(.8);
      });

    return this;
  }

  public createPointer() {
    const { h, w } = this.config.cellSize;
    const color = parseInt(this.config.colors.cell, 16);

    this.ui.pointer = this.add
      .rectangle(100, 20, w, h, color)
      .setVisible(false)
      .setDepth(1);

    return this;
  }

  public createRestartButton() {
    const { innerWidth: x } = window;
    const y = 40;

    const circle = this.add
      .circle(0, 10, 20)
      .setStrokeStyle(10, 0x00a8ff);

    const triangle = this.add
      .triangle(-17, 5, 0, 0, 0, 30, 30, 8, 0x00a8ff)
      .setRotation(39);

    this.ui.buttons.restart = this.add
      .container(
        x - 45,
        y + 60,
        [circle, triangle],
      )
      .setSize(50, 60)
      .setInteractive()
      .setAlpha(.8)
      .setDepth(2);

    const { restart } = this.ui.buttons;

    restart.once('destroy', () => {
      circle.destroy();
      triangle.destroy();
    });

    restart
      .on('pointerup', () => {
        if (!this.state.ready) { return; }

        this.restart({ add: {}, remove: {}, step: 0 });
      })
      .on('pointerover', () => {
        restart.setAlpha(1);
      })
      .on('pointerout', () => {
        restart.setAlpha(.8);
      });

    return this;
  }

  public createSeedsButton() {
    const { innerWidth: x, innerHeight: y } = window;
    const color       = 0xA3CB38;
    const borderColor = 0x009432;
    const w           = 70;
    const h           = 30;

    const textX       = -w;
    const textY       = 20 - h;
    const style       = { fontFamily: 'Arial', fontSize: 20, color: '#009432' };

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

    buttonSeed
      .on('pointerdown', () => {
        this.toggleSeedsPanel();
      })
      .on('pointerover', () => {
        buttonSeed.setScale(1.1, 1.1);
      })
      .on('pointerout', () => {
        buttonSeed.setScale(1, 1);
      });
  }

  public createSeedsPanel() {
    const { innerHeight: h, innerWidth: w } = window;

    const borderColor = 0x1B1464;
    const color       = 0xb2bec3;
    const x           = w / 2;
    const y           = h / 2;

    const textX       = w / 2;
    const textY       = 10;
    const style       = { fontFamily: 'Arial', fontSize: 40, color: '#fff' };

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

  public createUIControls() {
    this
      .createPauseButton()
      .createPlayButton()
      .createRestartButton()
      .createEditionModeButton()
      .createSeedsButton();

    return this;
  }

  public freeMemory() {
    const counter = this.ui.counter as Phaser.GameObjects.Text;
    const pointer = this.ui.pointer as Phaser.GameObjects.Rectangle;

    for (const [, button] of Object.entries(this.ui.buttons)) {
      button.destroy();
    }

    this.ui.lines.map((line) => { line.destroy(); });
    this.ui.lines = [];

    counter.destroy();
    pointer.destroy();

    this.ui.pointer = undefined;

    this.cleanBoard();
    window.clearInterval(this.timer);

    ipcRenderer.removeAllListeners('tick-reply');
    ipcRenderer.removeAllListeners('get-initial-state-reply');

    this.input.removeAllListeners('pointermove');
    this.input.removeAllListeners('pointerup');

    this.events.off('resize', this.resize, this, false);

    return this;
  }

  public init() {
    this.state = {
      cells: {},
      paused: true,
      ready: false,
      step: 0,
    };

    this.timer = undefined;

    this.ui = {
      buttons: {
        editionMode: undefined,
        pause: undefined,
        play: undefined,
        restart: undefined,
        seeds: undefined,
      },
      cells: {},
      counter: undefined,
      editionMode: 'add',
      lines: [],
      pointer: undefined,
      seedsPanel: undefined,
    };

    return this;
  }

  /**
   * Draw cells
   */
  public initCells(seed: Cell[]) {
    const { cells }               = this.state;
    const color                   = parseInt(this.config.colors.cell, 16);
    const { h, w }                = this.config.cellSize;
    const visualCells             = this.ui.cells as VisualCellMap;

    seed
      .map((cell) => {
        const key = `${cell.x},${cell.y}`;

        if (cells[key]) { return; }

        const rect = this.add.rectangle(
          (cell.x + .5) * w,
          (cell.y + .5) * h,
          w, h,
          color,
        );

        visualCells[key] = rect;
        cells[key] = cell;
      });

    this.state.ready = true;
  }

  public listenEvents() {
    ipcRenderer.on('tick-reply', (event: Event, data: State) => {
      this.renderState(data);
    });

    // TODO: Create dedicated container for board
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const { paused, ready } = this.state;
      // const pointer = this.ui.pointer as Phaser.GameObjects.Rectangle;

      if (!paused || !ready) { return; }

      const { x, y } = pointer;
      const { h, w } = this.config.cellSize;

      const cursor = this.ui.pointer as Phaser.GameObjects.Rectangle;

      if (!cursor.visible) {
        cursor.setVisible(true);
      }

      const cellX = Math.floor(x / w);
      const cellY = Math.floor(y / h);

      const newX  = (cellX + .5) * w;
      const newY  = (cellY + .5) * h;

      cursor.x = newX;
      cursor.y = newY;

      const color = parseInt(this.config.colors.cell, 16);

      const key = `${cellX},${cellY}`;

      if (pointer.isDown) {
        const { editionMode } = this.ui;
        const visualCells = this.ui.cells as VisualCellMap;
        const { cells } = this.state;

        if (editionMode === 'add') {
          if (cells[key]) { return; }

          cells[key]        = { x: cellX, y: cellY };
          visualCells[key]  = this.add.rectangle(newX, newY, w, h, color);

        } else {
          if (!cells[key]) { return; }

          visualCells[key].destroy();

          delete visualCells[key];
          delete cells[key];
        }
      }
    });

    this.input.on('pointerup', () => {
      const { paused, ready } = this.state;

      if (!paused || !ready) { return; }

      const { cells }       = this.state;
      const { editionMode } = this.ui;
      const visualCells     = this.ui.cells as VisualCellMap;

      const color           = parseInt(this.config.colors.cell, 16);
      const { h, w }        = this.config.cellSize;
      const { x, y }        = this.ui.pointer as Phaser.GameObjects.Rectangle;

      const cellX = Math.round((x / w) - .5);
      const cellY = Math.round((y / h) - .5);

      const key = `${cellX},${cellY}`;

      if (editionMode === 'add') {
        if (cells[key]) { return; }

        visualCells[key] = this.add.rectangle(x, y, w, h, color);
        cells[key] = { x: cellX, y: cellY };

      } else {
        if (!cells[key]) { return; }

        visualCells[key].destroy();

        delete visualCells[key];
        delete cells[key];
      }
    });

    this.events.on('resize', this.resize, this);

    return this;
  }

  public pause() {
    window.clearInterval(this.timer);
    this.state.paused = true;

    return this;
  }

  public renderState(state: State) {
    const { add, remove }         = state;
    const { h, w }                = this.config.cellSize;

    const cells                   = this.state.cells as CellMap;
    const visualCells             = this.ui.cells as VisualCellMap;
    const color                   = parseInt(this.config.colors.cell, 16);

    this.state.step = state.step;
    this.updateCounter(state.step.toString());

    for (const [key, cell] of Object.entries(add)) {
      const rect = this.add.rectangle((cell.x + .5) * w, (cell.y + .5) * h, w, h, color);
      visualCells[key] = rect;
      cells[key] = cell;
    }

    for (const [key] of Object.entries(remove)) {
      if (!cells[key]) { return; }

      visualCells[key].destroy();

      delete visualCells[key];
      delete cells[key];
    }
  }

  public resize() {
    const { innerHeight: height, innerWidth: width } = window;

    this.cameras.resize(width, height);
    this.restart({
      add     : Object.assign({}, this.state.cells),
      remove  : {},
      step    : this.state.step,
    });
  }

  public restart(config: State) {
    this
      .freeMemory()
      .init()
      .create(config);
  }

  public start() {
    this.timer = window.setInterval(() => { this.tick(); }, 1000);
    this.state.paused = false;

    const pointer = this.ui.pointer as Phaser.GameObjects.Rectangle;
    pointer.setVisible(false);

    return this;
  }

  public stopTick() {
    const pause = this.ui.buttons.pause as Phaser.GameObjects.Container;

    pause.setVisible(false);
    window.clearInterval(this.timer);
  }

  public tick() {
    const { cells, step }   = this.state;
    const { columns, rows } = this.config.dimensions;

    if (Object.keys(cells).length < 1) {
      this.stopTick();
    }

    ipcRenderer.send('tick', { cells, columns, rows, step });
  }

  public toggleSeedsPanel() {
    let seedsPanel = this.ui.seedsPanel as Phaser.GameObjects.Container;

    if (!seedsPanel) {
      seedsPanel = this.createSeedsPanel();
    }

    if (seedsPanel.visible) {
      seedsPanel.setVisible(false);
      this.state.ready = true;

      const seedsBoards = seedsPanel.last as Phaser.GameObjects.Container;
      seedsBoards.removeAll(true);

      return;
    }

    seedsPanel.setVisible(true);
    this.state.ready = false;

    ipcRenderer.once('get-all-states-reply', (event: Event, seeds: NamedState[]) => {
      seeds
        .filter((seed) => seed.state.length > 0)
        .map((seed, i) => {
          const { name, state } = seed;
          this.createBoard({ i, name, seedsPanel, state });
        });
    });

    ipcRenderer.send('get-all-states');
  }

  public updateCounter(text: string) {
    const counter = this.ui.counter  as Phaser.GameObjects.Text;
    // Used to update interactive zone
    if (counter.text.length !== `${text}`.length) {
      counter.destroy();
      this.createCounter();
      return;
    }

    counter.text = text;
  }
}
