import 'phaser';

import { Event, ipcRenderer } from 'electron';

import defaultConfig from './defaultConfig.json';

import ButtonsControl from '../components/buttonsControl';
import SeedsPanel from '../components/seedsPanel';
import { Control } from '../const/control';

export default class MainScene extends Phaser.Scene {
  private config: BoardConfig = defaultConfig;

  private state: BoardState = {
    cells: {},
    paused: true,
    ready: false,
    step: 0,
  };

  private isGridDebug: boolean = false;

  /** Simulation elapsing time in ms. */
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

  private seedsPan!: SeedsPanel;

  constructor() {
    super({ key: 'MainScene' });
  }

  private controlPause() {
    if (!this.state.ready) { return; }

    const { paused } = this.state;

    if (!paused) {
      this.pause();
      this.notifyControlChanged(Control.pause);
    }
  }

  private controlPlay() {
    const { paused, ready } = this.state;

    if (!ready) { return; }

    if (paused) {
      this.start();
      this.notifyControlChanged(Control.play);
    }
  }

  private controlRestart() {
    if (!this.state.ready) { return; }
    this.reset();
  }

  private controltoggleEditionMode() {
    const { paused, ready } = this.state;

    if (!ready) { return; }

    if (paused) {
      const pointer = this.ui.pointer as Phaser.GameObjects.Rectangle;

      const { add: colorAdd, remove: colorRemove }
        = this.config.colors.editionMode;

      this.ui.editionMode = this.ui.editionMode === 'add' ?
        'remove' : 'add';

      if (this.ui.editionMode === 'add') {
        pointer.setFillStyle(parseInt(colorAdd, 16));
        this.notifyControlChanged(Control.editionModeRemove);

      } else {
        pointer.setFillStyle(parseInt(colorRemove, 16));
        this.notifyControlChanged(Control.editionModeAdd);
      }
    }
  }

  private controlToggleSeedsPanel() {
    this.toggleSeedsPanel();
  }

  // @ts-expect-error
  private create(config: State) {
    const { columns, rows } = this.config.dimensions;

    this.createGrid({ columns, rows, debug: true })
      .createCounter()
      .createInitialState(config)
      .createUIControls()
      .createPointer()
      .listenEvents();

    this.seedsPan = new SeedsPanel(this);
    this.seedsPan.hide();
  }

  private createCounter() {
    const { step } = this.state;
    const x = 30;
    const y = window.innerHeight - 70;
    const style = { fontFamily: 'Arial', fontSize: 64, color: '#fbc531' };

    this.ui.counter = this.add
      .text(x, y, `${step}`, style);

    return this;
  }

  private createGrid({ columns = 40, rows = 20, debug = false }) {
    const color = parseInt(this.config.colors.grid, 16);
    // const iconsBarOffset = this.config.iconsBar.width;
    // const width = window.innerWidth - iconsBarOffset;

    // const rowSize         = window.innerHeight / rows;
    // const columnSize      = width / columns;
    const rowSize = 20;
    const columnSize = 20;

    // const columnHeight    = window.innerHeight * 2;
    // const rowWidth        = width * 2;
    const columnEndY    = 20 * rows;
    const rowEndX        = 20 * columns;

    this.config.cellSize  = { h: rowSize, w: columnSize };

    const xInit = 100;
    const yInit = 300;

    if (debug) {
      for (let index = 0; index <= columns; index++) {
        const xPos = columnSize * index;

        const line = this.add.line(
          xInit,
          yInit,
          xPos,
          0,
          xPos,
          columnEndY,
          color,
        );

        this.ui.lines.push(line);
      }

      for (let index = 0; index <= rows; index++) {
        const yPos = rowSize * index;

        const line = this.add.line(
          yInit,
          xInit,
          0,
          yPos,
          rowEndX,
          yPos,
          color,
        );

        this.ui.lines.push(line);
      }

      this.isGridDebug = true;
    }

    return this;
  }

  private createInitialState(config: State) {
    if (config.add && Object.keys(config.add).length > 0) {
      this.renderState(config);
      this.state.ready = true;
      return this;
    }

    ipcRenderer.send('get-initial-state', config);

    ipcRenderer.on('get-initial-state-reply', (event, data: Cell[]) => {
      this.initCells(data);
    });

    return this;
  }

  private createPointer() {
    const { h, w } = this.config.cellSize;
    const color = parseInt(this.config.colors.cell, 16);

    this.ui.pointer = this.add
      .rectangle(100, 20, w / 2, h / 2, color)
      .setVisible(false)
      .setDepth(1);

    return this;
  }

  private createUIControls() {
    // tslint:disable-next-line: no-unused-expression
    new ButtonsControl(this);
    return this;
  }

  private destroyExistingCells() {
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

  // @ts-expect-error
  private init() {
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

  /** Draw cells */
  private initCells(seed: Cell[]) {
    const { cells }   = this.state;
    const color       = parseInt(this.config.colors.cell, 16);
    const { h, w }    = this.config.cellSize;
    const visualCells = this.ui.cells as VisualCellMap;

    seed.map((cell) => {
      const key = `${cell.x},${cell.y}`;

      if (cells[key]) { return; }

      const rect = this.add.rectangle(
        (cell.x + .5) * w,
        (cell.y + .5) * h,
        w / 1.5,
        h / 1.5,
        color,
      );

      visualCells[key] = rect;
      cells[key] = cell;
    });

    this.state.ready = true;
  }

  private listenEvents() {
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

        visualCells[key] = this.add.rectangle(x, y, w / 1.5, h / 1.5, color);
        cells[key] = { x: cellX, y: cellY };

      } else {
        if (!cells[key]) { return; }

        visualCells[key].destroy();

        delete visualCells[key];
        delete cells[key];
      }
    });

    this.events.on('loadBoard', this.loadBoard, this);

    this.events.on('control:toggleEditionMode', this.controltoggleEditionMode, this);
    this.events.on('control:pause', this.controlPause, this);
    this.events.on('control:play', this.controlPlay, this);
    this.events.on('control:restart', this.controlRestart, this);
    this.events.on('control:toggleSeedsPanel', this.controlToggleSeedsPanel, this);

    return this;
  }

  private loadBoard(state: Cell[]) {
    this
      .destroyExistingCells()
      .initCells(state);

    this.state.ready = true;
  }

  private notifyControlChanged(newControl: Control) {
    // this.events.emit(newState);
    this.events.emit('controlChanged', { newControl });
  }

  private pause() {
    window.clearInterval(this.timer);
    this.state.paused = true;

    return this;
  }

  private renderState(state: State) {
    const { add, remove } = state;
    const { h, w }        = this.config.cellSize;

    const cells           = this.state.cells as CellMap;
    const visualCells     = this.ui.cells as VisualCellMap;
    const color           = parseInt(this.config.colors.cell, 16);

    this.state.step = state.step;
    this.updateCounter(state.step.toString());

    for (const [key, cell] of Object.entries(add)) {
      const rect        = this.add.rectangle(
        ((cell.x + .5) * w),
        ((cell.y + .5) * h),
        w / 1.5,
        h / 1.5,
        color
      );

      visualCells[key]  = rect;
      cells[key]        = cell;
    }

    for (const [key] of Object.entries(remove)) {
      if (!cells[key]) { return; }

      visualCells[key].destroy();

      delete visualCells[key];
      delete cells[key];
    }
  }

  private reset() {
    this.state.step = 0;
    this.updateCounter('0');
    this.destroyExistingCells();
    window.clearInterval(this.timer);

    this.events.emit('control:pause');

    this.createInitialState({ add: {}, remove: {}, step: 0 });
  }

  private start() {
    this.timer = window.setInterval(() => { this.tick(); }, 1000);
    this.state.paused = false;

    const pointer = this.ui.pointer as Phaser.GameObjects.Rectangle;
    pointer.setVisible(false);

    return this;
  }

  private stopTick() {
    const pause = this.ui.buttons.pause as Phaser.GameObjects.Container;

    pause.setVisible(false);
    window.clearInterval(this.timer);
  }

  private tick() {
    const { cells, step }   = this.state;
    const { columns, rows } = this.config.dimensions;

    if (Object.keys(cells).length < 1) {
      this.stopTick();
    }

    ipcRenderer.send('tick', { cells, columns, rows, step });
  }

  // @ts-expect-error
  private toggleGridDebug() {
    if (this.isGridDebug) {
      this.ui.lines.map((line) => { line.setAlpha(0); });
      this.isGridDebug = false;

    } else {
      this.ui.lines.map((line) => { line.setAlpha(1); });
      this.isGridDebug = true;
    }
  }

  private toggleSeedsPanel() {
    this.seedsPan.isVisible() ?
      this.seedsPan.hide() :
      this.seedsPan.show();
  }

  private updateCounter(text: string) {
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
