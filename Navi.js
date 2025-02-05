/*
    Navi is Link's shoulder angel in Ocarina of Time.
    Spawns 3 other processes, and inhabits the application importing it - all 4 processes then watches the others for inactivity.
    Each Navi instance watches all the others, but each is watched with varying intensity (determined by relativePriority() ).

    Beware! The main application port is hard-assumed to be a multiple of 10 (ending in a zero) - I suspect bad things would happen if this is not the case.

    Usage:
        Just requiring Navi is enough to get it working - congratulations! Your application is now unkillable! 
        To terminate the application grab scissors in one hand and the computer power cable in t'other
        Only joking... run "node lib/Navi.js kill" in another terminal


    > node index.js
        - require(navi.js)
            - process argv will have index.js
            - add process entry script to map (will be index.js:3230)
            - add speculative processes to map (navi.js:3231-3)
            - remove local port process from map
            - start checkHeartbeats() which will ...
                - check each process is alive / start ones that aren't
            > node ./lib/navi.js 323#
                - add process entry script to map (will be navi.js:323#)
                - add speculative processes to map (navi.js:3231-3)
                - remove local port process from map
                - start checkHeartbeats() which will ...
                    - check each process is alive / start ones that aren't

    
    > node index.js
        - require(navi.js)
        

*/

function getArgs() 
{
    let params = process.argv.slice(2);                                     // all but the first 2 arguments
    const isInt = (i) => /^\d+$/.test(i);                                   // is it an integer?
    
    const args = 
    {
        command: process.argv[0],                                               // should be 'path/to/node'
        application: process.argv[1],                                           // 'path/to/scriptFile.js' - will not always be '.../Navi.js'
        kill: params.some(p => p === 'kill'),                                   // see if 'kill' was passed
        port: parseInt(params.find(p => isInt(p)) || 3230),                     // any integer is assumed to be the port - default to 3230
    };

    params = params.filter(p => p !== 'kill' && !isInt(p));                     // remove already processed arguments
    args.entry = params[0];                                                     // any remaining argument should be the entry script (the script the Navi need to keep awake)

    return args;
}
const args = getArgs();
const pport = args.port;                                                    // global ProcessPort - the port this Navi is listening on (kinda the navi-ID)
console.log(`${pport}: args: `, args);


/*
    // not needed because file output is handled when spawning
    (() => {

        const fs = require("fs");
        const {keys} = Object;
        const {Console} = console;

        /**
         * Redirect console to a file.  Call without path or with false-y
         * value to restore original behavior.
         * @param {string} [path]
         * /
        console.file = (path) => {
            const con = path ? new Console(fs.createWriteStream(path)) : null;

            keys(Console.prototype).forEach(key => {
                if (path) {
                    this[key] = (...args) => con[key](...args);
                } else {
                    delete this[key];
                }
            });
        };
    })()
*/
const http = require('http');
const { spawn } = require('child_process');
const internal = require('stream');


let naviNum = 3;                                                                                    // maintain 3 navis (hardcoded for now)
const isNavi = /\/Navi\.js$/.test(args.application);                                                // is the application a Navi? (This will be true for Navi's that aren't the main application)
var relativePriority = (local, remote) => ((local+naviNum) - remote) % naviNum;                     // calculation of a unique modifier for each navi's relationship to the remote navi
console.debug(`${pport}: navi test: ${isNavi}`);

let heartToken = null;
const navis = new Map();

const application = isNavi ? args.entry : args.application;                                             // get proper entry script from args (if it's a navi the application is sent as args.entry, otherwise it's just the application)
console.debug(`${pport}: navi started`, process.argv, '#keep');


/**
 * Initialise a navi instance with the given port
 * @param {int} port The port this navi should listen to (also used as the Navi's Id)
 */
function init(port = 3230)
{
    buildNaviCollection(port);
    spinUpServer(port);

    for(const [key, value] of navis.entries())
    {
        //const salt = Math.floor(Math.random() * 15000);                                                     // random salt to introduce variation between
        const salt = Math.floor(Math.random() * 2000);                                                          // random salt to introduce variation between Navi instances
        const period = 5000 + salt + (relativePriority(port, key) * (3000 + salt));
        console.debug(`${port}: will check ${key} every ${period}ms`);
        heartToken = setInterval(() => checkHeartbeats(key, value), period);
    }
}


/**
 * Build the collection of navis from this Navi's perspective
 * @param {int} port The port for this Navi
 */
function buildNaviCollection(port)
{
    const idx = port % 10;                                                                              // local navi index
    const portBase = port - idx;                                                                        // navi cluster base port - the port rounded to the nearest 10

    for(let i = 0; i<=naviNum; i++)                                                                     // for the number of Navis
    {
        let potentialPort = portBase + i;                                                                   // construct the port number
        if(potentialPort !== port)                                                                          // if it's not the local port ...
            navis.set(potentialPort,                                                                        // collect the info for the navi
                        { 
                            procName: potentialPort === portBase ? application : __filename,                    // for navis, this script is the procName
                            application: application                                                            // the application is the application
                        });
    }
    console.log(`${port}: collected: `, navis, '#keep', '#init');
}


/**
 * create an http server that: responds to /kill and /navi - kills current process if another is already listening on current port
 */
function spinUpServer(port)
{
    console.log(`${port}: creating server`);
    const httpServer = http.createServer((request, response) => 
    {
        console.log(`${port}: received ${request.url}`);
        if(request.url === '/kill') quit();                                                                     // if the request is to kill, quit           
        else if(request.url === '/navi')                                                                        // if the request is to check if the navi is alive
        {
            response.setHeader('Content-Type', 'text/plain');                                                       // Set the 'Content-Type' in response header
            response.writeHead(200);                                                                                // set success response code
            response.end(`alive ${process.pid}`);                                                                   // send process ID in response body
        }
        else
        {
            response.writeHead(204);
            response.end();
        }
    });
    
    httpServer.on('error', (e) =>                                                                               // if the server fails to start
    {
        if (e.code === 'EADDRINUSE')                                                                                // if the port is already in use
        {
            console.log(`!!! another instance already listening on ${port} - quitting, goodbye`);
            process.exit(0);                                                                                        // quit
        }
        console.error(`${port}: httpServer error: `, e);                                                        // otherwise, log the error
    });

    console.log(`${pport}: trying listen`);
    httpServer.listen(port, () => 
    {
        console.log(`\x1b[32mServer is running at http://127.0.0.1:${port}\x1b[0m`);
    });
}


// request options
const options = {
    //hostname: '127.0.0.1',        // host / hostname defaults to localhost 
    path: '/navi',
    method: 'GET'
};
const aliveResponse = /alive (\d+)/;

function checkHeartbeats(remotePort, navi)
{
    console.log(`${pport}: checking heartbeat for ${remotePort}`, '#heartbeat', '#low');
    options.port = remotePort;

    // const req = http.request(options, (res) => 
    http.request(options, (res) => 
    {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        
        res.on('end', () => {
            console.log(`${pport}: Body(${remotePort}):`, data, '#heartbeat', '#low');
            if(aliveResponse.test(data))
            {
                navi.pid = data.replace(aliveResponse, '$1');
                console.debug(`${pport}: set ${remotePort}'s PID to ${navi.pid}`, '#heartbeat', '#low');
            }
        });
        
    }).on("error", (err) => {
        console.log(`${pport}: Error: ${remotePort}, ${err}`);
        dealWithDeadness(remotePort, navi);
    }).end()
}

let timeouts = [];
function dealWithDeadness(deadPort, deadNavi)
{
    /*
        dead-check count (test script):
        (localPort, deadPort) => ((localPort + (numNavis*2))) - deadPort) % numNavis;

        var navis = [3120, 3121, 3122, 3123, 3124, 3125, 3126];
        var relativePriority = (local, dead) => ((local+navis.length) - dead) % navis.length;
        navis.forEach(dead => console.log(`dead (${dead}): `, navis.filter(local => local !== dead && local !== 3120).map(local => relativePriority(local, dead))));
    */
    
    let priority = relativePriority(pport, deadPort);                                       // get the priority this Navi has with the dead Navi
    priority **= 3;                                                                         // cube it to increase the delay spacing  // cube it to make it more likely to be the last one to restart (copilot wrote this comment)

    timeouts.push(setTimeout(() =>
    {
        if(!quitting)
        {
            try{
                process.kill(deadNavi.pid, 'SIGKILL');                                         // try to kill the dead Navi by process id (this could be more subtle, but we're just cleaning up here...)
            } catch(e) {
                console.error();(`${pport}: error SIGKILLing ${deadNavi.pid}`);
            }
        }
    }, priority * 100));
    
    /// TODO: delay here but kill the timeout if quitting (race condition this can be starting a new process as quitting happens and restart a just-killed process)
    timeouts.push(setTimeout(() =>
    {
        if(!quitting)
            wake(deadNavi.application, deadNavi.procName, deadPort);                              // respawn
    }, priority * 200));
}


const stdio = 'inherit';
/**
 * Run a new process to replace the one we've found is missing
 * @param {String} application the application we're ultimately keeping alive
 * @param {String} scriptFile The script we're actually going to run
 * @param {int} newPort The port the new process will listen on
 */
function wake(application, scriptFile = './lib/Navi.js', newPort = 3231)
{
    console.log(`${pport}: wake up ${application}:${newPort}!`, '#wake', '#keep');

    // special handling for windows (untested cos I'm not using win node)
    if (/^win/i.test(process.platform)) 
    {
        const fs = require('fs');
        console.debug('detected windows', '#wake');
        const out = fs.openSync('./tmp/navi.log', 'a');
        const err = fs.openSync('./tmp/navi.log', 'a');
        stdio =  [ 'ignore', out, err ];
    }

    const subprocess = spawn('node', [scriptFile, newPort, application], { 
        detached: true,
        stdio: stdio
    });

    subprocess.unref();                                                                                     // allows the parent to exit (windows also needs the stdio / ipc to not be connected, linux (and mac?) doesn't care)
}


let quitting = false;                                                                                   // we simply DON'T QUIT! ... by default
/**
 * tell everyone to pack up and go home... then say goodbye.
 */
function quit()
{
    quitting = true;                                                                                            // set the quitting flag
    args.kill ? 
        console.debug(`quit() called - Navi started with KILL ARG and port ${pport}:`, '#quit', '#keep'):
            console.debug(`${pport}: quit() called`, '#quit', '#keep');

    heartToken && clearInterval(heartToken);                                                                    // make sure navis aren't going to be respawned after quitting :)

    console.log(`${pport}: exiting (clearing ${timeouts.length} deferred wake-ups)`, '#quit');
    timeouts.forEach(t => clearTimeout(t));                                                                     // clear all the timeouts
    timeouts = [];                                                                                              // empty the timeouts array
    const options = { path: '/kill', method: 'GET' };

    //navis.size === 0 && navis.set(pport, {});                                                                 // ok - this will be the case when running "node lib/Navi.js kill" as init() will not be called - that means the http server won't be running and sending kill to pport will actually call the main application (by default - you could specify another port on the cli) // actually not sure why I did this? // if we're the only navi, add ourselves to the list so we can kill ourselves
    navis.size === 0 && buildNaviCollection(pport);                                                             // if the navis array is empty, init() hasn't run (this happens if Navi.js is started with a 'kill' arg) - if so, build the navis array so we can tell them all to quit 

    for(const [key, navi] of navis.entries())                                                                   // tell everyone to quit
    {
        if(!navi.killed)                                                                                            // don't kill the same port twice
        {
            console.log(`${pport}: killing ${key}`, '#quit');
            options.port = key;                                                                                         // set the port to kill
            navi.killed = true;                                                                                         // mark it as killed        
            http.request(options, () => console.log(`${pport}: killed ${options.port}`) )                               // kill it
                // .on("error", (err) => console.log(`${pport}: kill error: `, err))
                .on("error", () => {})                                                                                  // we don't care if there's an error I think.... we do get errors telling already dead sockets to kill themselves
                .end()
        }
    }
    
    setTimeout(quit, 1050);                                                                                     // wait a bit, then quit again (eventually this will disappear when process.exit() kicks in)
    setTimeout(() => process.exit(0), 2000);                                                                    // wait a bit, then exit
}


args.kill ? quit() : init(args.port);                                                                       // quit or init?
        
module.exports = { init };



let count = 3;
/**
 * wave your hands and say hi!
 */
function go()
{
    setTimeout(() =>
    {
        console.log(`${pport}: Navi ${count}`, '#low');
        if(count-- > 0) go();
    },
    1000);
}

go();

