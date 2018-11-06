import test from 'ava';

import { born, convertArrayToHash } from '../src/main/algorithms';

import oscillators from '../src/main/seeds/oscillators.json';
import spaceships from '../src/main/seeds/spaceships.json';
import stillLives from '../src/main/seeds/still-lives.json';

const columns = 80;
const rows = 40;

test('born should return an empty object when passing an empty array', (t) =>{
  const cells = born({ cells: [], rows, columns });

  t.true(Object.keys(cells).length === 0);
});

test('born should return an object with at least one key when array contains oscillators', (t) => {
  const hash = convertArrayToHash(oscillators);
  const cells = born({ cells: hash, rows: rows, columns: columns });

  t.true(Object.keys(cells).length > 0);
});

test('born should return an object with at least one key when array contains spaceships', (t) => {
  const hash = convertArrayToHash(spaceships);
  const cells = born({ cells: hash, rows: rows, columns: columns });

  t.true(Object.keys(cells).length > 0);
});

test('born should return an empty object when array only contains still lives', (t) => {
  const hash = convertArrayToHash(stillLives);
  const cells = born({ cells: hash, rows, columns });

  t.true(Object.keys(cells).length === 0);
});

