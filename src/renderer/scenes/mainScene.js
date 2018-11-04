import 'phaser';

import { ipcRenderer } from 'electron'

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });

    this.config = {
      cellSize: { h: 0, w: 0 },
      colors: {
        cellBorder: 0x78e08f,
        cell: 0xb8e994,
        grid: 0xecf0f1,
      },
      dimensions: {
        columns: 80,
        rows: 40,
      },
    }
  }

  init() {
    this.state = {
      cells: {},
      paused: true,
      step: 0,
    }

    this.timer = undefined

    this.ui = {
      buttons: {
        pause: {},
        play: {},
        restart: {},
      },
      cells: {},
      counter: {},
    }

    return this
  }

  create() {
    const { columns, rows } = this.config.dimensions

    this.drawGrid({ columns: columns, rows: rows})
      .createInitialState()
      .createCounter()
      .createUIControls()
      .listenEvents()
  }

  createUIControls() {
    const { innerWidth: x } = window
    const y = 40

    // Pause button
    const r1 = this.add.rectangle(0, 0, 10, 50, 0x6666ff)
    const r2 = this.add.rectangle(20, 0, 10, 50, 0x6666ff)

    this.ui.buttons.pause = this.add
      .container(x - 60, y, [r1, r2])
      .setSize(50, 100)
      .setInteractive()
      .setAlpha(.5)
      .setVisible(false)

    // Play button
    this.ui.buttons.play = this.add.triangle(
      x - 45, y, 0, 0, 0, 45, 45, 22.5, 0xe84118)
      .setInteractive()
      .setAlpha(.5)


    // Restart button
    var circle = this.add.circle(0, 10, 20)
      .setStrokeStyle(10, 0x00a8ff);

    const triangle = this.add.triangle(
      -17, 5, 0, 0, 0, 30, 30, 8, 0x00a8ff)
      .setRotation(39)

    this.ui.buttons.restart = this.add
      .container(
        x - 45,
        y + 60,
        [circle, triangle]
      )
      .setSize(50, 60)
      .setInteractive()
      .setAlpha(.5)

    // Events
    // ------
    const { pause, play, restart } = this.ui.buttons

    // destroy
    pause.once('destroy', () => {
      r1.destroy()
      r2.destroy()
    })

    restart.once('destroy', () => {
      circle.destroy()
      triangle.destroy()
    })

    // Pause
    pause.on('pointerdown', () => {
      const { paused } = this.state

      if (!paused) {
        this.pause()
        play.setVisible(true)
        pause.setVisible(false)
      }
    })

    pause.on('pointerover', () => {
      pause.setAlpha(1)
    })

    pause.on('pointerout', () => {
      pause.setAlpha(.5)
    })

    // Play
    play.on('pointerdown', () => {
      const { paused } = this.state

      if (paused) {
        this.start()

        play.setVisible(false)
        pause.setVisible(true)
      }
    })

    play.on('pointerover', () => {
      play.setAlpha(1)
    })

    play.on('pointerout', () => {
      play.setAlpha(.5)
    })

    // Restart
    restart.on('pointerdown', () => {
      this.restart()
    })

    restart.on('pointerover', () => {
      restart.setAlpha(1)
    })

    restart.on('pointerout', () => {
      restart.setAlpha(.5)
    })

    return this
  }

  createCounter() {
    const { step } = this.state

    this.ui.counter = this.add.text(30, window.innerHeight - 70,
      `${step}`, {
        fontFamily: 'Arial', fontSize: 64, color: '#fbc531' })
        .setInteractive()
        .setAlpha(.6);

    const { counter } = this.ui

    counter.on('pointerover', () => {
      counter.setAlpha(1)
    })

    counter.on('pointerout', () => {
      counter.setAlpha(.6)
    })

    return this
  }

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
      {
        x: 0,
        y: 1,
      },
      {
        x: 1,
        y: 0,
      },
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

      // {
      //   x: 10,
      //   y: 10,
      // },
      // {
      //   x: 11,
      //   y: 10,
      // },
      // {
      //   x: 10,
      //   y: 11,
      // },
      // {
      //   x: 11,
      //   y: 11,
      // },
    ];

    this.initCells(seed);

    return this
  }

  /**
   * Create grid
   */
  drawGrid({ columns = 80, rows = 40 }) {
    const { grid: color } = this.config.colors

    const rowSize = window.innerHeight / rows;
    const columnSize = window.innerWidth / columns;

    const columnHeight = window.innerHeight * 2;
    const rowWidth = window.innerWidth * 2;

    this.config.cellSize = { h: rowSize, w: columnSize };

    for (let index = 0; index < columns; index++) {
      const columnOffset = columnSize * index;
      this.add.line(0, 0, columnOffset, 0, columnOffset, columnHeight, color);
    }

    for (let index = 0; index < rows; index++) {
      const rowOffset = rowSize * index;
      this.add.line(0, 0, 0, rowOffset, rowWidth, rowOffset, color);
    }

    return this;
  }

  freeMemory() {
    for (const [, button] of Object.entries(this.ui.buttons)) {
      button.destroy()
    }

    for (const [, cell] of Object.entries(this.ui.cells)) {
      cell.destroy()
    }

    this.ui.counter.destroy()

    window.clearInterval(this.timer)

    ipcRenderer.removeAllListeners('tick-reply')

    return this
  }

  /**
   * Draw cells
   */
  initCells(seed) {
    const { h, w } = this.config.cellSize
    const { cells } = this.state
    const { cells: visualCells } = this.ui
    const { cell: color } = this.config.colors

    seed.map((cell) => {
      const rect = this.add.rectangle(
        (cell.x + .5) * w,
        (cell.y + .5) * h,
        w, h,
        color
       )

      visualCells[`${cell.x},${cell.y}`] = rect
      cells[`${cell.x},${cell.y}`] = cell
    });
  }

  listenEvents() {
    ipcRenderer.on('tick-reply', (event, data) => {
      this.renderState(data)
    })

    return this
  }

  pause() {
    window.clearInterval(this.timer)
    this.state.paused = true

    return this
  }

  renderState(state = {}) {
    const { add, remove } = state
    const { h, w } = this.config.cellSize

    const { cells } = this.state
    const { cells: visualCells } = this.ui
    const { cell: color } = this.config.colors

    this.state.step = state.step
    this.updateCounter(state.step)

    for (const [key, cell] of Object.entries(add)) {
      const rect = this.add.rectangle((cell.x + .5) * w, (cell.y + .5) * h, w, h, color)
      visualCells[key] = rect
      cells[key] = cell
    }

    for (const [key] of Object.entries(remove)) {
      if (!cells[key]) return

      cells[key] = undefined

      visualCells[key].destroy()
      visualCells[key] = undefined

      delete visualCells[key]
      delete cells[key]
    }
  }

  restart() {
    this.freeMemory()
      .init()
      .create()
  }

  start() {
    this.timer = window.setInterval(() => { this.tick() }, 1000)
    this.state.paused = false

    return this;
  }

  stopTick() {
    const { pause } = this.ui.buttons

    pause.setVisible(false)
    window.clearInterval(this.timer)
  }

  tick() {
    const { cells, step } = this.state
    const { columns, rows } = this.config.dimensions

    if (Object.keys(cells).length < 1) {
      this.stopTick()
    }

    ipcRenderer.send('tick', { cells, columns, rows, step })
  }


  updateCounter(text) {
    // Used to update interactive zone
    if (this.ui.counter.text.length !== `${text}`.length) {
      this.ui.counter.destroy()
      this.createCounter()
      return
    }

    this.ui.counter.text = text
  }
}
