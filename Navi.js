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

*/

function getArgs() 
{
    /*
    // generic args parsing (hacked on from stack overflow) - probably overkill
    const args = 
    {
        command: process.argv[0],
        application: process.argv[1],
        params: []
    };
    
    process.argv
        .slice(2)
        .forEach(arg => 
                {
                    if (arg.slice(0,2) === '--')                                            // long arg
                    {
                        const longArg = arg.split('=');
                        const longArgKey = longArg[0].slice(2, longArg[0].length);
                        const longArgValue = longArg.length > 1 ? longArg[1] : true;
                        args[longArgKey] = longArgValue;
                    }
                    else if (arg[0] === '-')                                                // flags
                    {
                        const flags = arg.slice(1).split('');
                        flags.forEach(flag => args[flag] = true);
                    }
                    else
                    {
                        args.params.push(arg);
                    }
                });
    /*/
    // specific args parsing
    let params = process.argv.slice(2);                                     // all but the first 2 arguments
    const isInt = (i) => /^\d+$/.test(i);                                   // is it an integer?
    
    const args = 
    {
        command: process.argv[0],                                               // should be 'path/to/node'
        application: process.argv[1],                                           // 'path/to/scriptFile.js' - will not always be '.../Navi.js'
        kill: params.some(p => p === 'kill'),                                   // see if 'kill' was passed
        port: parseInt(params.find(p => isInt(p)) || 3231),                     // any integer is assumed to be the port - default to 3231
    };

    //args.kill && (args.port = args.port - (args.port % 10) + 9);              // one iteration, kill needed a non-existant port in the same multiple of ten - this made it ###9... was dodgy

    params = params.filter(p => p !== 'kill' && !isInt(p));                     // remove already processed arguments
    args.entry = params[0];                                                     // any remaining argument should be the entry script (the script the Navi need to keep awake)
    //*/
    return args;
}
const args = getArgs();
const port = args.port;
console.log(`${port}: args ${args}`);


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
    console.log(`${port}: wake up ${application}:${newPort}!`);
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
module.exports = { wake };


/**
 * this only happens when Navi.js is started as a process
 */
const isNavi = (a) => /\/Navi\.js$/.test(a);
//console.log('navi test: ' + args.application);
console.log(`${port}: navi test: ` + isNavi(args.application));

if(isNavi(args.application))                                    // if command line application script ends with /Navi.js
{
    let heartToken = null;
    const navis = new Map();

    let naviNum = 3;                                                // maintain 3 navis
    /*
    const application = process.argv[3];                            // get proper entry script from args
    const port = parseInt(process.argv[2]) || 3231;                 // by default be the bootstrapper (ends in 1)
    console.log(`navi started ${process.argv}`);
    /*/
    const application = args.entry;                                 // get proper entry script from args
    console.log(`${port}: navi started ${process.argv}`);
    //*/

    function init()
    {

        //console.file(`./tmp/navi-${port}.log`);

        const idx = port % 10;                                          // local navi index
        const portBase = port - idx;                                    // navi cluster base port - the port rounded to the nearest 10
        // let bootstrapper = (port % 10 === 1);                        // does this process need to start the other Navi procs
        // if(bootstrapper)

        navis.set(portBase, {                                           // collect the info for the application process
                                procName: application,                      // procName is the script that should be run
                                application: application                    // the application is the main application 
                            });

        for(let i = 1; i<=naviNum; i++)                                  // for the number of Navis
        {
            let potentialPort = portBase + i;                               // construct the port number
            if(potentialPort !== port)                                      // if it's not the local port ...
                navis.set(potentialPort,                                    // collect the info for the navi
                            { 
                                //procName: 'Navi.js', 
                                procName: __filename,                           // for navis, this script is the procName
                                application: application                        // the application is the application
                            });
        }
        console.log(`${port}: collected:`);
        console.log(navis);

        spinUpServer();

        heartToken = setInterval(checkHeartbeats, 10000 + Math.floor(Math.random() * 5000));
    }



    function spinUpServer()
    {
        console.log(`${port}: creating server`);
        const httpServer = http.createServer((request, response) => 
        {
            console.log(`${port}: received ${request.url}`);
            if(request.url === '/kill') quit();
            else if(request.url === '/navi')
            {
                response.setHeader('Content-Type', 'text/plain');                           // Set the 'Content-Type' in response header
                response.writeHead(200);
                response.end(`alive ${process.pid}`);
            }
            else
            {
                response.writeHead(204);
                response.end();
            }
        });
        
        httpServer.on('error', (e) => 
        {
            if (e.code === 'EADDRINUSE') 
            {
                console.log(`!!! another instance already listening on ${port} - quitting, goodbye`);
                process.exit(0);
            }
            console.error(`${port}: httpServer error: `, e);
        });

        console.log(`${port}: trying listen`);
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
    
    let timeouts = [];
    function dealWithDeadness(valuePort, value)
    {
        /*
            dead-check count:
            (localPort, deadPort) => ((localPort + (numNavis*2))) - deadPort) % numNavis;      
        */
        /// TODO: remember, recent restarts? Double check they get killed? Longer initialisation delay before checking other navis?
        timeouts.push(setTimeout(() =>
        {
            if(!quitting)
            {
                try{
                    process.kill(value.pid, 'SIGKILL');                                         // try kill value.pid (this could be more subtle, but we're just cleaning up here...)
                } catch(e) {
                    console.error();(`${port}: error SIGKILLing ${value.pid}`);
                }
            }
        }, 1200));

        /// TODO: delay here but kill the timeout if quitting (race condition this can be starting a new process as quitting happens and restart a just-killed process)
        timeouts.push(setTimeout(() =>
        {
            if(!quitting)
                wake(value.application, value.procName, valuePort);                             // respawn
        }, 1800));

    }


    let quitting = false;
    /**
     * tell everyone to pack up and go home... then say goodbye.
     */
    function quit()
    {
        // if(!quitting)
        // {
            quitting = true;
            heartToken && clearInterval(heartToken);                                            // make sure navi's aren't going to be respawned after quitting :)
            timeouts.forEach(t => clearTimeout(t));
            console.log(`${port}: exiting`);
            const options = { path: '/kill', method: 'GET' };

            navis.size === 0 && navis.set(port, {});

            for(const [key, value] of navis.entries())
            {
                options.port = key;
                console.log(`${port}: killing ${options.port}`);
                http.request(options, () => {})
                    // .on("error", (err) => console.log(`${port}: kill error: `, err))
                    .on("error", () => {})                      // we don't care if there's an error I think.... we do get errors telling already dead sockets to kill themselves
                    .end()
            }
            
            setTimeout(quit, 1050);                                                             // wait a bit, then quit again (eventually this will disappear when process.exit() kicks in)
            setTimeout(() => process.exit(0), 2000);                                            // wait a bit, then exit
        // }
    }


    args.kill ? quit() : init();                                                        // quit or init?
            

    let count = 5;
    /**
     * wave your hands and say hi!
     */
    function go()
    {
        setTimeout(() =>
        {
            console.log(`${port}: Navi ${count}`);
            if(count-- > 0) go();
        },
        3000);
    }

    go();
}

