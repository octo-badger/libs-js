
// read standard input (couple of ways here: https://stackoverflow.com/questions/58143781/the-correct-way-to-read-from-stdin-in-nodejs)
// parse the input as logs


const readline = require('readline');

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


async function go()
{
    for await (line of reader) 
    {
        console.log(`got log: ${line}`);
    }
}

go();