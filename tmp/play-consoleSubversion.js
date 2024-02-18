
console.log('my message', { an: 'object' }, 'uh oh', '#tag', '#low');
console.debug('my message', { an: 'object' }, 'uh oh', '#tag', '#low');
console.info('my message', { an: 'object' }, 'uh oh', '#tag', '#low');

console.log('subverting in 3, 2, 1 ...');
require('../SubvertConsole');

console.log('my message', { an: 'object' }, 'uh oh', '#tag', '#low');
console.log('my message', { an: 'object' }, 'no tags oop');
console.debug('my message', { an: 'object' }, 'uh oh', '#tag', '#low');
console.info('my message', { an: 'object' }, 'uh oh', '#tag', '#low');
