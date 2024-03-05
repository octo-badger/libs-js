
const { timestamp } = require('./Extensions');


global.debugLog = [];
const logSize = 120;
const log3rd = Math.floor(logSize / 3);


// subvert the console
(function()
{
    const persist = (logEntry, tags) => setTimeout(() => 
    {
        debugLog.push({ log: logEntry, tags: tags.join('-')});
        
        const windowSize = log3rd + Math.ceil(Math.random() * log3rd);

        for(let i=5; debugLog.length > logSize && i>0; i--)            // (only might remove >1 if log fills with 'keeps' - probably not worth it, but...) while debugLog has more than N entries, up to a maximum of 5 times
        {
            let iy = debugLog.findIndex((log, j) => j < windowSize && /\blow\b/.test(log.tags));                // get index of the oldest log entry with a 'low' tag
            if(iy < 0) iy = debugLog.findIndex(log => !/\bkeep\b/.test(log.tags));                              // if there wasn't one, get index of the oldest log entry without a 'keep' tag
            if(iy >= 0) debugLog.splice(iy, 1);                                                                 // if we found a log, remove it 
        }
    }, 10);

    const { log, debug, error } = global.console;

    const tagPattern = /^#\w+$/;


    function createLogger(level, output)
    {
        return (msg, ...args) => 
        {
            let tagIndex = args.findIndex(i => tagPattern.test(i));                                 // find the first tag-lookin' thang
            let tags = tagIndex > -1 ? args.splice(tagIndex) : [];                                  // if tags were found - extract them from args into tags array ELSE (when index is -1) leave args as is and create an empty tags array
            let logEntry = `${timestamp()} (${level}): ${msg}`;                                            // add time stamp and log level
            output && output(logEntry, ...args);
            // capture / intercept string output from log classic to pass to persist?
            persist(logEntry, tags);
        }
    }
    

    global.console.log = createLogger('log', log);

    global.console.debug = createLogger('debug');               // undefined output will prevent output to stdout, but will still add logs
        


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