/*
    Test script that generated some logs to be consumed by logyum.
    usage:
        > node tmp/play-logyum.js | node logyum.js
*/    


require('../SubvertConsole');

// do nothing, but output some logs about it all

let i=0; 
createTimeout();


function createTimeout()
{
    // let token = setTimeout(shout, 500 + Math.floor(Math.random() * 2000));
    setTimeout(shout, 500 + Math.floor(Math.random() * 2000));
}

function shout()
{
    console.log(`INFO this is a message (${Math.random()})`);
    if(++i < 5)
        createTimeout()
}