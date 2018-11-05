import test from 'ava';

import { born, kill } from '../src/main/algo';

import stillLives from '../src/main/seeds/still-lives.json';
import spaceships from '../src/main/seeds/spaceships.json';

const columns = 80;
const rows = 40;

// Born
// test('born should return an empty object when passing an empty array', (t) =>{
//   const cells = born({ cells: [], rows, columns });

//   t.true(Object.keys(cells).length === 0);
// });

// test('born should return an empty object when array only contains still lives', (t) => {
//   const cells = born({ cells: stillLives, rows, columns });

//   t.true(Object.keys(cells).length === 0);
// });

// test('born should return an object with at least one key when array contains spaceship', (t) => {
//   const cells = born({ cells: spaceships, rows: rows, columns: columns });
//   console.log(spaceships);

//   console.log(cells);

//   t.true(Object.keys(cells).length > 0);
// });

test('kill should return an object with at least one key when array contains spaceship', (t) => {
  const cells = kill({ cells: spaceships, rows: rows, columns: columns });
  console.log(spaceships);

  console.log(cells);

  t.true(Object.keys(cells).length > 0);
});

// Kill
// test('kill should return an empty object when passing an empty array', (t) => {
//   const cells = kill({ cells: [], rows, columns });

//   t.true(Object.keys(cells).length === 0);
// });

// test('kill should return an empty object when array only contains still lives', (t) => {
//   console.log('----');
//   console.log(Object.keys(stillLives).length);

//   const cells = kill({ cells: stillLives, rows, columns });

//   t.true(Object.keys(cells).length === 0);
// });