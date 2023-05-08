// Navi is Link's shoulder angel in Ocarina of Time

/*

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

function wake(application, scriptFile = './lib/Navi.js', newPort = 3231)
{
    console.log(`${pport}: wake up ${application}:${newPort}!`);
    let stdio = 'inherit';

    // special handling for windows (untested cos I'm not using win node)
    if (/^win/i.test(process.platform)) 
    {
        const fs = require('fs');
        console.debug('detected windows');
        const out = fs.openSync('./tmp/navi.log', 'a');
        const err = fs.openSync('./tmp/navi.log', 'a');
        stdio =  [ 'ignore', out, err ];
    }

    const subprocess = spawn('node', [scriptFile, newPort, application], { 
        detached: true,
        stdio: stdio
    });

    subprocess.unref();                                             // allows the parent to exit (windows also needs the stdio / ipc to not be connected, linux (and mac?) doesn't care)
}


let naviNum = 3;                                                                                    // maintain 3 navis
const isNavi = /\/Navi\.js$/.test(args.application);                                                // is the application a Navi?
var relativePriority = (local, remote) => ((local+naviNum) - remote) % naviNum;                     // calculation of a unique modifier for each navi's relationship to the remote navi
console.debug(`${pport}: navi test: ${isNavi}`);



let heartToken = null;
const navis = new Map();

const application = isNavi ? args.entry : args.application;                                             // get proper entry script from args (if it's a navi the application is sent as args.entry, otherwise it's just the application)
console.debug(`${pport}: navi started`, process.argv);

function init(port = 3230)
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
    console.log(`${port}: collected:`);
    console.log(navis);

    spinUpServer(port);

    for(const [key, value] of navis.entries())
    {
        const salt = Math.floor(Math.random() * 15000);
        const period = 5000 + salt + (relativePriority(port, key) * (3000 + salt));
        console.debug(`${port}: will check ${key} every ${period}ms`);
        heartToken = setInterval(() => checkHeartbeats(key, value), period);
    }
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

    
/*
function checkHeartbeats()
{
    console.log(`${port}: checking heartbeats`);
    const aliveResponse = /alive (\d+)/;

    for(const [key, value] of navis.entries())
    {
        console.log(`${port}: checking ${key}`);
        options.port = key;

        const req = http.request(options, (res) => 
        {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            
            res.on('end', () => {
                //console.log(`${port}: Body:`, JSON.parse(data));
                console.log(`${port}: Body(${key}):`, data);
                if(aliveResponse.test(data))
                {
                    value.pid = data.replace(aliveResponse, '$1');
                    console.debug(`${port}: set ${key}'s PID to ${value.pid}`);
                }
                else
                {
                    //dealWithDeadness(key, value);
                }
            });
            
        }).on("error", (err) => {
            //console.log(`${port}: Error: `, err);
            console.log(`${port}: Error: ${key}, ${err}`);
            dealWithDeadness(key, value);
        }).end()
    }
}
/*/
function checkHeartbeats(remotePort, navi)
{
    console.log(`${pport}: checking heartbeat for ${remotePort}`);
    const aliveResponse = /alive (\d+)/;

    console.log(`${pport}: checking ${remotePort}`);
    options.port = remotePort;

    const req = http.request(options, (res) => 
    {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        
        res.on('end', () => {
            console.log(`${pport}: Body(${remotePort}):`, data);
            if(aliveResponse.test(data))
            {
                navi.pid = data.replace(aliveResponse, '$1');
                console.debug(`${pport}: set ${remotePort}'s PID to ${navi.pid}`);
            }
        });
        
    }).on("error", (err) => {
        console.log(`${pport}: Error: ${remotePort}, ${err}`);
        dealWithDeadness(remotePort, navi);
    }).end()
}
//*/

let timeouts = [];
function dealWithDeadness(deadPort, value)
{
    /*
        dead-check count:
        (localPort, deadPort) => ((localPort + (numNavis*2))) - deadPort) % numNavis;

        var navis = [3120, 3121, 3122, 3123, 3124, 3125, 3126];
        var relativePriority = (local, dead) => ((local+navis.length) - dead) % navis.length;
        navis.forEach(dead => console.log(`dead (${dead}): `, navis.filter(local => local !== dead && local !== 3120).map(local => relativePriority(local, dead))));

    */
    
    let priority = relativePriority(pport, deadPort);
    priority **= 3;                                                         // cube it to increase the delay spacing  // cube it to make it more likely to be the last one to restart (copilot wrote this)
    

    timeouts.push(setTimeout(() =>
    {
        if(!quitting)
        {
            try{
                process.kill(value.pid, 'SIGKILL');                                         // try kill value.pid (this could be more subtle, but we're just cleaning up here...)
            } catch(e) {
                console.error();(`${pport}: error SIGKILLing ${value.pid}`);
            }
        }
    }, priority * 100));

    
    /// TODO: delay here but kill the timeout if quitting (race condition this can be starting a new process as quitting happens and restart a just-killed process)
    timeouts.push(setTimeout(() =>
    {
        if(!quitting)
            wake(value.application, value.procName, deadPort);                              // respawn
    }, priority * 200));
}


let quitting = false;
/**
 * tell everyone to pack up and go home... then say goodbye.
 */
function quit()
{
    quitting = true;                                                                                            // set the quitting flag
    heartToken && clearInterval(heartToken);                                                                    // make sure navi's aren't going to be respawned after quitting :)

    console.log(`${pport}: exiting (clearing ${timeouts.length} deferred wake-ups)`);
    timeouts.forEach(t => clearTimeout(t));                                                                     // clear all the timeouts
    timeouts = [];                                                                                              // empty the timeouts array
    const options = { path: '/kill', method: 'GET' };

    navis.size === 0 && navis.set(pport, {});                                                                    // actually not sure why I did this? // if we're the only navi, add ourselves to the list so we can kill ourselves

    for(const [key, navi] of navis.entries())                                                                   // tell everyone to quit
    {
        if(!navi.killed)                                                                                            // don't kill the same port twice
        {
            options.port = key;                                                                                         // set the port to kill
            console.log(`${pport}: killing ${options.port}`);
            navi.killed = true;                                                                                         // mark it as killed        
            http.request(options, () => console.log(`${pport}: killed ${options.port}`) )                                // kill it
                // .on("error", (err) => console.log(`${pport}: kill error: `, err))
                .on("error", () => {})                                                                                  // we don't care if there's an error I think.... we do get errors telling already dead sockets to kill themselves
                .end()
        }
    }
    
    setTimeout(quit, 1050);                                                                                     // wait a bit, then quit again (eventually this will disappear when process.exit() kicks in)
    setTimeout(() => process.exit(0), 2000);                                                                    // wait a bit, then exit
}


args.kill ? quit() : init(args.port);                                                                                // quit or init?
        
module.exports = { init };



let count = 3;
/**
 * wave your hands and say hi!
 */
function go()
{
    setTimeout(() =>
    {
        console.log(`${pport}: Navi ${count}`);
        if(count-- > 0) go();
    },
    1000);
}

go();

