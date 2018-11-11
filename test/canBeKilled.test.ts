import test from 'ava';

import { canBeKilled, convertArrayToHash } from '../src/main/algorithms';

const columns = 80;
const rows = 40;

test('canBeKilled should return true when no neighbours is alive', (t) => {
  const arr: Cell[] = [ { x: 0, y: 0 } ];

  const cells = convertArrayToHash(arr);
  const gridConfig = { cells, columns, rows, step: 0 };

  const mustBeKilled = canBeKilled({ x: 0, y: 0 }, gridConfig);

  t.true(mustBeKilled);
});

test('canBeKilled should return false when 2 neighbours is alive', (t) => {
  const arr: Cell[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }];

  const cells = convertArrayToHash(arr);
  const gridConfig = { cells, columns, rows, step: 0 };

  const mustBeKilled = canBeKilled({ x: 0, y: 0 }, gridConfig);

  t.false(mustBeKilled);
});

test('canBeKilled should return false when 3 neighbours is alive', (t) => {
  const arr: Cell[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ];

  const cells = convertArrayToHash(arr);

  const mustBeKilled = canBeKilled({ x: 0, y: 0 }, { cells, columns, rows, step: 0 });

  t.false(mustBeKilled);
});

test('canBeKilled should return true when > 3 neighbours is alive', (t) => {
  const arr: Cell[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
  ];

  const cells = convertArrayToHash(arr);

  const mustBeKilled = canBeKilled({ x: 1, y: 1, }, { cells, columns, rows, step: 0 });

  t.true(mustBeKilled);
});
