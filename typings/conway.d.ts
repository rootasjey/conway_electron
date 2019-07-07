/**
 * Board's size (rows, columns), cell's size, color.
 */
interface BoardConfig {
  /**
   * Cell's width & height.
   */
  cellSize: Size2D;

  colors: ColorConfig;

  /**
   * Rows & columns number.
   */
  dimensions: Dimensions;

  iconsBar: {
    width: number;
  }
}

interface BoardSeedConfig {
  i: number;
  name: string;
  seedsPanel: Phaser.GameObjects.Container;
  state: Cell[];
}

/**
 * Data for current grid's visual representation.
 */
interface BoardState {
  /**
   * Alive cells.
   * Only contains cells coordinates.
   */
  cells: CellMap

  /**
   * True if the simulation is not running.
   */
  paused: boolean

  /**
   * True if the simulation can start/resume.
   */
  ready: boolean

  /**
   * Number of steps elapsed since the initial state.
   */
  step: number
}

/**
 * An object containing indexed cells.
 * Key is stored as [`Cell.x,Cell.y`].
 */
interface CellMap {
  [index: string]: Cell
}

/**
 * An object positionned on a 2-axis space (x, y).
 */
interface Cell {
  /**
   * X coordinate.
   */
  x: number,

  /**
   * Y coordinate.
   */
  y: number
}

/**
 * UI colors config.
 */
interface ColorConfig {
  cellBorder: string;
  cell: string;

  /**
   * Colors of 'editionMode' button.
   */
  editionMode: EditionModeColorConfig;
  grid: string;
}

/**
 * Has a `columns` & a `rows` property.
 */
interface Dimensions {
  /**
   * Number of columns.
   */
  columns: number;

  /**
   * Number of rows.
   */
  rows: number;
}

interface EditionModeColorConfig {
  /**
   * Add button's color.
   */
  add: string;

  /**
   * Remove button's color.
   */
  remove: string;
}

/**
 * Game user interface.
 */
interface GameUI {
  /**
   * Existing buttons.
   */
  buttons: GameUIButtons;

  /**
   * Graphical cell representation.
   */
  cells: VisualCellMap | {};
  counter?: Phaser.GameObjects.Text;
  editionMode: string;
  lines: Phaser.GameObjects.Line[];
  pointer?: Phaser.GameObjects.Rectangle;
  seedsPanel?: Phaser.GameObjects.Container;
}

/**
 * Visual buttons.
 */
interface GameUIButtons {
  editionMode?: Phaser.GameObjects.Container;
  pause?: Phaser.GameObjects.Container;
  play?: Phaser.GameObjects.Triangle;
  restart?: Phaser.GameObjects.Container;
  seeds?: Phaser.GameObjects.Container;
}

/**
 * Data to calculate next state.
 */
interface GridConfig {
  /**
   * Alive cells
   * (if a cell exists in this map, it's alive).
   */
  cells: CellMap | [];

  /**
   * Columns available in the grid.
   */
  columns: number;

  /**
   * Rows available in the grid.
   */
  rows: number;

  /**
   * Step state (0 for initial, 1, 2, ...)
   */
  step: number;
}

interface NamedState {
  name: string;
  state: Cell[];
}

/**
 * Has a height and a width.
 */
interface Size2D {
  h: number;
  w: number;
}

interface State {
  add: CellMap;
  remove: CellMap;
  step: number;
}

/**
 * Object containg a graphical representation of the board.
 */
interface VisualCellMap {
  [index: string]: Phaser.GameObjects.Rectangle;
}
