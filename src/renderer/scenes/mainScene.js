import 'phaser';

import { ipcRenderer } from 'electron'

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });

    this.cellsAlive       = {};

    this.cellBorderColor  = 0x78e08f;
    this.cellColor        = 0xb8e994;
    this.cellSize         = { h: 0, w: 0 };
    this.gridColor        = 0xecf0f1;

    this.columns          = 80;
    this.rows             = 40;

    this.timer            = undefined
    this.visualCells      = {};

    this.step = 0;
    this.counter = {};

    this.controls = {
      play: {},
      pause: {}
    }
  }

  preload() {
  }

  create() {
    // const r1 = this.add.rectangle(200, 200, 148, 148, 0x6666ff);
    // const r2 = this.add.rectangle(400, 200, 148, 148, 0x9966ff);
    // r2.setStrokeStyle(4, 0xefc53f);

    this.drawGrid({ columns: this.columns, rows: this.rows});
    this.createInitialState();
    this.createCounter()
    this.createControls()

    this.timer = window.setInterval(() => { this.tick() }, 1000)
  }

  /**
   * Create grid
   */
  drawGrid({ columns = 80, rows = 40}) {
    const rowSize = window.innerHeight / rows;
    const columnSize = window.innerWidth / columns;

    const columnHeight = window.innerHeight * 2;
    const rowWidth = window.innerWidth * 2;

    this.cellSize = { h: rowSize, w: columnSize };

    for (let index = 0; index < columns; index++) {
      const columnOffset = columnSize * index;
      this.add.line(0, 0, columnOffset, 0, columnOffset, columnHeight, this.gridColor);
    }

    for (let index = 0; index < rows; index++) {
      const rowOffset = rowSize * index;
      this.add.line(0, 0, 0, rowOffset, rowWidth, rowOffset, this.gridColor);
    }
  }

  createControls() {
    this.controls.play.geom = this.add.triangle(
      window.innerWidth - 45, 120, 0, 0, 0, 45, 45, 22.5, 0xe84118)

    const r2 = this.add.rectangle(0, 200, 0, 50, 50, 50, this.cellColor)

    var r1 = this.add.rectangle(200, 200, 148, 148, 0x6666ff);
  }

  createCounter() {
    this.counter = this.add.text(window.innerWidth - 70, 10,
      `${this.step}`, {
        fontFamily: 'Arial', fontSize: 64, color: '#fbc531' });
  }

  updateCounter(text) {
    this.counter.text = text
  }

  /**
   * createInitialState
   */
  createInitialState() {
    const seed = [
      {
        x: 0,
        y: 0,
      },
      {
        x: 1,
        y: 1,
      },
      // {
      //   x: 2,
      //   y: 1,
      // },
      // {
      //   x: 3,
      //   y: 1,
      // },
      // {
      //   x: 4,
      //   y: 1,
      // },
      // {
      //   x: 5,
      //   y: 1,
      // },
      // {
      //   x: 6,
      //   y: 1,
      // },
      // {
      //   x: 7,
      //   y: 1,
      // },
      // {
      //   x: 8,
      //   y: 1,
      // },
      // {
      //   x: 9,
      //   y: 1,
      // },
      // {
      //   x: 10,
      //   y: 1,
      // },
      {
        x: 3,
        y: 3,
      },
      {
        x: 2,
        y: 2,
      },
      {
        x: 4,
        y: 2,
      },
    ];

    this.drawCells(seed);
  }

  /**
   * Draw cells
   */
  drawCells(cells) {
    const { w, h } = this.cellSize;

    cells.map((cell) => {
      const rect = this.add.rectangle(
        (cell.x + .5) * w,
        (cell.y + .5) * h,
        w, h,
        this.cellColor
       )

      this.visualCells[`${cell.x},${cell.y}`] = rect
      // .setStrokeStyle(4, this.cellBorderColor);

      this.cellsAlive[`${cell.x},${cell.y}`] = cell
    });
  }

  renderState(state = {}) {
    const { add, remove } = state
    const { w, h } = this.cellSize;

    this.updateCounter(state.step)

    for (const [key, cell] of Object.entries(add)) {
      const rect = this.add.rectangle((cell.x + .5) * w, (cell.y + .5) * h, w, h, this.cellColor)
      this.visualCells[key] = rect
      this.cellsAlive[key] = cell
    }

    for (const [key] of Object.entries(remove)) {
      if (!this.cellsAlive[key]) return

      this.cellsAlive[key] = undefined

      this.visualCells[key].destroy()
      this.visualCells[key] = undefined

      delete this.visualCells[key]
      delete this.cellsAlive[key]
    }
  }

  tick() {
    if (Object.keys(this.cellsAlive).length < 1) {
      window.clearInterval(this.timer)
    }

    ipcRenderer.on('tick-reply', (event, data) => {
      this.renderState(data)
    })

    ipcRenderer.send('tick', {
      cells   : this.cellsAlive,
      columns : this.columns,
      rows    : this.rows,
      step    : this.step,
    })
  }
}
