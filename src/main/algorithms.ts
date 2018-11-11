/**
 * Return cells to born.
 * @param {GridConfig} config Grid current state to calculate the next state.
 */
export function born(config: GridConfig): CellMap {
  const { cells = {} } = config;
  const cellsToBorn: CellMap = {};

  for (const [, cell] of Object.entries(cells)) {
      getNeighbours(cell)
        .map((neighbour) => {
          const deadCell = getCell(neighbour, config);

          if (!deadCell) {
            const canBeAlive = canStayAlive(neighbour, config);

            if (canBeAlive) {
              const { x, y } = getNormalizedCoord(neighbour, config);
              cellsToBorn[`${x},${y}`] = { x, y };
            }
          }
    });
  }

  return cellsToBorn;
}

/**
 * Return true if the cell can be killed.
 * @param cell Target cell to kill or not.
 * @param config Grid current state.
 */
export function canBeKilled (cell: Cell, config: GridConfig): boolean {
  const cells = config.cells as CellMap;

  let aliveNeighbours = 0;

  getNeighbours(cell)
  .map((neighbour) => {
      if (aliveNeighbours > 3) { return; } // early check

      const { x, y } = getNormalizedCoord(neighbour, config);
      const key = `${x},${y}`;

      if (cells[key]) { aliveNeighbours++; }
    });

  return aliveNeighbours !== 2 && aliveNeighbours !== 3;
}

/**
 * Return true if the cell can stay alive.
 * @param cell Cell to check its neighbours.
 * @param config Grid's config.
 */
export function canStayAlive(cell: Cell, config: GridConfig): boolean {
  let aliveNeighbours = 0

  getNeighbours(cell)
    .map((neighbour) => {
      const cellExist = getCell(neighbour, config);

      if (cellExist) {
        aliveNeighbours++
      }
    });

  return aliveNeighbours === 3;
}

/**
 * Return an object containing cells.
 * @param arr Array of cells to convert.
 */
export function convertArrayToHash(arr: Cell[]): CellMap {
  const cellMap: CellMap = {};

  arr.map((item) => cellMap[`${item.x},${item.y}`] = item);

  return cellMap;
}

/**
 * Return alive cell according to its x,y coordinates or undefined if any.
 * @param target Object containing x,y coordinates.
 * @param config Grid'state.
 */
function getCell(target: Cell, config: GridConfig): Cell | undefined | null {
  const cells = config.cells as CellMap;

  const { x, y } = getNormalizedCoord(target, config);

  return cells[`${x},${y}`];
}

/**
 * Return coordinates w/o overflow (w/ grid's size constrains).
 * @param coord Coordinates to normaize.
 * @param config Grid's state.
 */
function getNormalizedCoord(coord: Cell, config: GridConfig): Cell {
  const { columns, rows } = config;
  const { x, y } = coord;

  let normalizedX = x < 0 ? columns + x : x;
  let normalizedY = y < 0 ? rows + y : y;

  normalizedX = normalizedX % columns;
  normalizedY = normalizedY % rows;

  return { x: normalizedX, y: normalizedY };
}

/**
 * Return an array of 8-directional neighbours (alive & dead).
 * @param cell Target cell to find neighbours from.
 */
function getNeighbours(cell: Cell): Cell[] {
  const vector: Cell[] = [
    {
      x: -1,
      y: -1,
    },
    {
      x: 0,
      y: -1,
    },
    {
      x: 1,
      y: -1,
    },
    {
      x: 1,
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
      x: -1,
      y: 1,
    },
    {
      x: -1,
      y: 0,
    },
  ];

  const { x, y } = cell;

  return vector.map((coord) => { return { x: x + coord.x, y: y + coord.y }});
}

/**
 * Return cells to kill.
 * @param {GridConfig} config Grid current state to decide who must die.
 */
export function kill(config: GridConfig) {
  const { cells = {} } = config;
  const cellsToKill: CellMap = {};

  for (const [, cell] of Object.entries(cells)) {
    const { x, y } = cell;
    const mustBeKilled = canBeKilled(cell, config);

    if (mustBeKilled) { cellsToKill[`${x},${y}`] = cell; }
  }

  return cellsToKill;
}
