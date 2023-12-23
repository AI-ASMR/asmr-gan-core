import type {Config} from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
    verbose: true,
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.json'
        }],
    },
    moduleNameMapper: {
        '@common/(.*)': '<rootDir>/common/$1',
        '@lib/(.*)': '<rootDir>/lib/$1',
        '@bin/(.*)': '<rootDir>/bin/$1',
    },
};
export default config;