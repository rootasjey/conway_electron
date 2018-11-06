import test from 'ava';

import { convertArrayToHash } from '../src/main/algorithms';

test('convertArrayToHash should return an empty object when passing an empty array', (t) => {
  const arr = [];

  const cells = convertArrayToHash(arr);

  t.true(Object.keys(cells).length === 0);
});

test('convertArrayToHash should return an object with', (t) => {
  const arr = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ];

  const cells = convertArrayToHash(arr);

  arr.map((cell) => {
    const key = `${cell.x},${cell.y}`;

    t.truthy(cells[key]);
  });
});