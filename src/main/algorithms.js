/**
 * Return cells to born.
 * @param {Object} config
 */
export function born(config = {}) {
  const { cells = {}, rows = 0, columns = 0 } = config;
  const cellsToBorn = {};

  for (const [, cell] of Object.entries(cells)) {
    const neighbours = getNeighbours({ x: cell.x, y: cell.y });

    neighbours.map((neighbour) => {
      const deadCell = getCell({ target: neighbour, cells, rows, columns });

      if (!deadCell) {
        const canBeAlive = checkAliveNeighbours({ target: neighbour, cells, rows, columns });

        if (canBeAlive) {
          const { x, y } = getNormalizedCoord({ x: neighbour.x, y: neighbour.y, rows, columns });
          cellsToBorn[`${x},${y}`] = { x, y };
        }
      }
    })
  }

  return cellsToBorn;
}

export function canBeKilled(config = {}) {
  const { x, y, cells, rows, columns } = config;
  let aliveNeighbours = 0;

  const neighbours = getNeighbours({ x, y });

  neighbours.map((neighbour) => {
    if (aliveNeighbours > 3) { return; } // early check

    const { x, y } = getNormalizedCoord({ x: neighbour.x, y: neighbour.y, rows, columns });
    const key = `${x},${y}`;

    if (cells[key]) { aliveNeighbours++; }
  });

  return aliveNeighbours !== 2 && aliveNeighbours !== 3;
}

function checkAliveNeighbours(config = {}) {
  const { target, cells, rows, columns } = config;
  let aliveNeighbours = 0

  const neighbours = getNeighbours(target);

  neighbours.map((neighbour) => {
    const cellExist = getCell({ target: neighbour, cells, rows, columns });

    if (cellExist) {
      aliveNeighbours++
    }
  });

  return aliveNeighbours === 3;
}

export function convertArrayToHash(arr = []) {
  const hash = {};

  arr.map((item) => hash[`${item.x},${item.y}`] = item);

  return hash;
}

function getCell(config = {}) {
  const { target, cells = {}, rows = 0, columns = 0 } = config;

  const { x, y } = getNormalizedCoord({ x: target.x, y: target.y, rows, columns });

  return cells[`${x},${y}`];
}

function getNormalizedCoord(config = {}) {
  const { columns, rows, x, y } = config;

  let normalizedX = x < 0 ? columns + x : x;
  let normalizedY = y < 0 ? rows + y : y;

  normalizedX = normalizedX % columns;
  normalizedY = normalizedY % rows;

  return { x: normalizedX, y: normalizedY };
}

function getNeighbours({x, y}) {
  const vector = [
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

  return vector.map((coord) => { return { x: x + coord.x, y: y + coord.y }});
}

/**
 * Return cells to kill.
 * @param {Object} config
 */
export function kill(config = {}) {
  const { cells = {}, rows = 0, columns = 0 } = config;
  const cellsToKill = {};

  for (const [, cell] of Object.entries(cells)) {
    const { x, y } = cell;
    const mustBeKilled = canBeKilled({ x, y, cells, rows, columns });

    if (mustBeKilled) { cellsToKill[`${x},${y}`] = cell; }
  }

  return cellsToKill;
}
