import { argv, args } from './args';

console.log(argv, args);

setTimeout(() => {
    console.log(argv, args);
}, 3000);