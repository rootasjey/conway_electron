import oscillators  from './seeds/oscillators.json';
import sample1      from './seeds/sample1.json';
import sample2      from './seeds/sample2.json';
import spaceships   from './seeds/spaceships.json';
import stillLives   from './seeds/still-lives.json';

export function getInitialSate() {
    return oscillators;
}

export function getAllStates() {
    return [
        {
            name: 'oscillators',
            state: oscillators,
        },
        {
            name: 'sample1',
            state: sample1,
        },
        {
            name: 'sample2',
            state: sample2,
        },
        {
            name: 'spaceships',
            state: spaceships,
        },
        {
            name: 'stillLives',
            state: stillLives,
        },
    ]
}
