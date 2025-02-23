/*

    notes:
        - what happens if this get required multiple times? - I think we get multiple subversions stacked - fix this
        - I want to be able to subvert console.blah() calls locally to a module to inject tags specific to a module
            - provide function to create a local console object that creates functions that pass on to global.console?
*/

const { timestamp } = require('./Extensions');


global.debugLog = [];
const logSize = 120;
const log3rd = Math.floor(logSize / 3);

                                
/**
 *   subvert the console
 */
(function()
{
    /**
     * Deferred persistence of the log entry to local structure that is automatically cleaned up when over-sized
     * @param {String} logEntry log text including timestamp and level
     * @param {Array<String>} tags an array of strings
     */
    const persist = (logEntry, tags) => setTimeout(() => 
    {
        debugLog.push({ log: logEntry, tags: tags.join('-')});                                              // add log to memory storage - join tags delimited by hyphens
        
        const windowSize = log3rd + Math.ceil(Math.random() * log3rd);                                      // create a random-ish window size (atm up to 2/3 of the total possible log entries)

        for(let i=5; debugLog.length > logSize && i>0; i--)                                                 // (only might remove >1 if log fills with 'keeps' - probably not worth it, but...) while debugLog has more than N entries, up to a maximum of 5 times
        {
            let iy = debugLog.findIndex((log, j) => j < windowSize && /\b#low\b/.test(log.tags));               // get index of the oldest log entry with a 'low' tag - must be within the first 'windowSize' number of items (ie won't find more recent 'low' entries - give them a chance to be noticed even when the log is filling with higher priority entries)
            if(iy < 0) iy = debugLog.findIndex(log => !/\b#keep\b/.test(log.tags));                             // if there wasn't one, get index of the oldest log entry without a 'keep' tag
            if(iy >= 0) debugLog.splice(iy, 1);                                                                 // if we found a log, remove it 
        }
    }, 10);

    const { log, debug, error } = global.console;

    const tagPattern = /^#\w+$/;                                                                    // tags must be # then word characters


    function createLogger(level, output)
    {
        return (msg, ...args) => 
        {
            let tagIndex = args.findIndex(i => tagPattern.test(i));                                 // find the first tag-lookin' thang (this isn't bullet-proof, users must be sensible)
            let tags = tagIndex > -1 ? args.splice(tagIndex) : [];                                  // if tags were found - extract them from args into tags array ELSE (when index is -1) leave args as is and create an empty tags array
            let logEntry = `${timestamp()} (${level}): ${msg}`;                                     // add time stamp and log level
            output && output(logEntry, ...args);                                                    // if there's an output, pass what we have to that
            // ideally, capture / intercept string output from log classic to pass to persist?
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