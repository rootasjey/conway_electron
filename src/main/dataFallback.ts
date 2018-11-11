import oscillators  from './seeds/oscillators.json';
import sample1      from './seeds/sample1.json';
import sample2      from './seeds/sample2.json';
import spaceships   from './seeds/spaceships.json';
import stillLives   from './seeds/still-lives.json';

/**
 * Return the 1st initial state found.
 */
export function getInitialSate(): Cell[] {
    return oscillators;
}

/**
 * Return all available initial states.
 */
export function getAllStates(): NamedState[] {
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

export function getState(name: string) {
    const namedState = getAllStates()
        .filter(({ name: stateName }) => stateName === name);

    if (namedState.length === 0) {
        console.warn(`The named state ${name} doesn't exist. Consider trying another name.`);
        return { name: '', state: [] };
    }

    return namedState[0]
}
