
const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

function timestamp()
{
    let d = new Date();
    return `${d.getFullYear()}${(d.getMonth()+1+'').padStart(2, '0')}${(d.getDate()+'').padStart(2, '0')}-${d.toLocaleTimeString('default', timeOptions)}.` + `${d.getMilliseconds()}`.padStart(3, '0');
}


global.debugLog = [];

/*
let x = [1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3];
let s = 8; 
let e = 18;
let y = x.slice(s, e);

for(let i=20; i>0; i--)
{
    let iy = y.findIndex(l => l === 1);
    console.log(iy);
    if(iy>=0) 
    {
        y.splice(iy, 1);
        let ix = iy + s;
        console.log(ix);
        x.splice(ix, 1);
    }
}
console.dir(x);
console.dir(y);
//*/



const logSize = 120;
let log3rd = Math.floor(logSize / 3);


//*
// subvert the console
(function()
{
    let persist = (logEntry, tags) => setTimeout(() => 
    {
        debugLog.push({ log: logEntry, tags: tags.join('-')});
        
        // let logWindow = debugLog.slice(windowSize);
        let windowSize = log3rd + Math.ceil(Math.random() * log3rd);

        for(let i=5; debugLog.length > logSize && i>0; i--)            // (only might remove >1 if log fills with 'keeps' - probably not worth it, but...) while debugLog has more than N entries, up to a maximum of 5 times
        {
            /*
            let iy = logWindow.findIndex(log => /\blow\b/.test(log.tags));
            if(iy < 0) iy = logWindow.findIndex(log => !/\bkeep\b/.test(log.tags));
            
            if(iy >= 0) 
            {
                logWindow.splice(iy, 1);
                let ix = iy;
                debugLog.splice(ix, 1);
            }
            /*/
            let iy = debugLog.findIndex((log, j) => j < windowSize && /\blow\b/.test(log.tags));
            if(iy < 0) iy = debugLog.findIndex(log => !/\bkeep\b/.test(log.tags));
            if(iy >= 0) debugLog.splice(iy, 1);
            //*/
        }
    }, 10);

    let { log, debug, error } = global.console;

    /*
    global.console.log = (msg, ...tags) => 
    {
        let logEntry = `log ${timestamp()}: ${msg}`;
        log(logEntry);
        persist(logEntry, tags);
    }
    /*/
    let tagPattern = /^#\w+$/;

    global.console.log = (msg, ...args) => 
    {
        let tagIndex = args.findIndex(i => tagPattern.test(i));                                // find the first tag-lookin' thang
        let tags = tagIndex > -1 ? args.splice(tagIndex) : [];                                 // if tags were found - extract them from args into tags array ELSE (when index is -1) leave args as is and create an empty tags array
        let logEntry = `log ${timestamp()}: ${msg}`;                                        // add time stamp and log level
        log(logEntry, ...args);
        // capture / intercept string output from log classic to pass to persist?
        persist(logEntry, tags);
    }
    //*/

    global.console.debug = (msg, ...tags) => 
    {
        let logEntry = `dbg ${timestamp()}: ${msg}`;
        //debug(log);                                       // don't output debug to stdout (debug classic)
        persist(logEntry, tags);
    };



    // global.console.debug = () => {};
    // global.console.error = (msg) => 
    // {
    //     if(msg instanceof Error) console.log('is Error');
    //     if(msg.message) 
    //     {
    //         log(`has message: ${msg.message}`);
    //         log(`stack: ${msg.stack}`);
    //         log(`stackTraceLimit: ${Error.stackTraceLimit}`);
    //         msg.message = `err ${timestamp()}: ${msg.message}`;
    //         error(msg.message);
    //         error(msg.stack)
    //     }
    //     else
    //         error(msg);     
    // };
})()
//*/