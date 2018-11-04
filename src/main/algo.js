/**
 * for each cell alive
 * 1. get 8 neightbours
 * 2. for each neightbour
 * 3. if cell is dead: OK
 * 4. check if dead cell has 3 neightbours alive cells
 * 5. if so, born cell
 *
 * @param {Object} config
 */
export function born(config = {}) {
  const { cells = [], rows = 0, columns = 0 } = config;
  const cellsToBorn = {};

  for (const [, cell] of Object.entries(cells)) {
    for (let x = cell.x - 1; x <= cell.x + 1; x++) {
      for (let y = cell.y - 1; y <= cell.y + 1; y++) {
        // out of bounds
        let x1 = x < 0 ? columns - x : x;
        let y1 = y < 0 ? rows - y : y;

        x1 = x1 % columns;
        y1 = y1 % rows;

        const deadCell = cells[`${x1},${y1}`]

        if (!deadCell) {
          const canBeAlive = checkAliveNeighbours({ x: x1, y: y1, cells, rows, columns });

          if (canBeAlive) {
            cellsToBorn[`${x1},${y1}`] = { x: x1, y: y1 };
          }
        }
      }
    }
  }

  return cellsToBorn;
}

function checkAliveNeighbours({ x, y, cells, rows, columns }) {
  let aliveNeighbours = 0

  for (let x1 = x - 1; x1 <= x + 1; x1++) {
    for (let y1 = y - 1; y1 <= y + 1; y1++) {
      // out of bounds
      let x2 = x1 < 0 ? columns - x1 : x1
      let y2 = y1 < 0 ? rows - y1 : y1

      x2 = x1 % columns
      y2 = y1 % rows

      if (cells[`${x2},${y2}`]) {
        aliveNeighbours++
      }
    }
  }

  return aliveNeighbours === 3
}

export function kill(config = {}) {
  const { cells = [], rows = 0, columns = 0 } = config;
  const cellsToKill = {};

  for (const [, cell] of Object.entries(cells)) {
    const { x, y } = cell;
    const mustBeKilled = canBeKilled({ x, y, cells, rows, columns });

    if (mustBeKilled) { cellsToKill[`${x},${y}`] = cell; }
  }

  return cellsToKill;
}

function canBeKilled({ x, y, cells, rows, columns }) {
  let aliveNeighbours = 0;

  for (let x1 = x - 1; x1 <= x + 1; x1++) {
    for (let y1 = y - 1; y1 <= y + 1; y1++) {
      // out of bounds
      let x2 = x1 < 0 ? columns - x1 : x1;
      let y2 = y1 < 0 ? rows - y1 : y1;

      x2 = x1 % columns;
      y2 = y1 % rows;

      if (x2 === x && y2 === y) { continue; }

      if (cells[`${x2},${y2}`]) {
        aliveNeighbours++;
      }

      // Early check
      if (aliveNeighbours > 3) return true;
    }
  }

  return aliveNeighbours !== 2 && aliveNeighbours !== 3;
}
