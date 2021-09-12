
const fs = require('fs');
exports.id = 'Settings';

let debug = info = log = warn = error = ()=>{};

class Settings 
{

    constructor(options) 
    {
        options = this.options = Object.assign(
        { 
            defaultData: {},
            logger: console
        },
        options);

        this.fileName = null;
        this.fileData = null;
     
        options.logger && ({debug, info, log, warn, error} = options.logger);
    }


    /**
     * load a json settings file
     * @param {string} fileName the json file to load
     */
    //static async load(fileName)       // easier to not make this static at the mo for logger access - could make a static initialisation with setter in the future
    async load(fileName) 
    {
        this.fileName = fileName;

        this.fileData = await new Promise((resolve, reject) => 
        {
            /*
            fs.readFile(fileName, (err, data) =>
            {
                if (err) error(err);
                
                let parsedData = data == null ?
                                    this.options.defaultData :
                                        JSON.parse(data);

                resolve(parsedData);
            });
            /*/
            let resolver = (data) =>
            {
                let parsedData = data == null ?
                                    this.options.defaultData :
                                        JSON.parse(data);

                resolve(parsedData);
            }

            Settings._untestable_readFile(fileName, resolver);
            //*/
        });

        let writeToken = null;
        let writeOp = () => 
        {
            clearTimeout(writeToken);
            writeToken = setTimeout(() => 
            {
                let data = JSON.stringify(this.fileData, null, '\t');
                debug(`writing ${this.fileName}:\n${data}`);

                Settings._untestable_writeFile(this.fileName, data);
            }, 200);
        }
                
        this.fileData = Settings._addAccessors(this.fileData, writeOp);

        return this.fileData;
    }



    //static #addAccessors(obj3ct)      // private methods unsupported until nodejs v12
    //static _addAccessors(obj3ct)
    /**
     * pass an object to get its entire heirarchy reactive
     * @param {object} obj3ct preferralby an object?
     * @param {function} operation a function to call when the object structure is modified
     * @returns a proxied object, ready to listen
     */
    static _addAccessors(obj3ct, operation)
    {
        log(`adding accessors to ${JSON.stringify(obj3ct)}`);
        obj3ct.__isProxy && warn(`obj3ct.__isProxy`);

        let handler = 
        {
            // get(target, name, receiver) 
            // {
            //     // typeof name === "symbol" ?
            //     //     log(`get prop (symbol): ${name.toString()}`) :
            //     //         log(`get prop: ${name}`);

            //     return Reflect.get(...arguments);
            // },
            set(target, name, value, receiver) 
            {
                /*
                typeof name === "symbol" ?
                    debug(`set prop (symbol): ${name.toString()}`) :
                        debug(`set prop: ${name}`);
                /*/
                let propName = typeof name === "symbol" ? `(symbol): ${name.toString()}` : name;
                debug(`set prop: ${propName}`);
                //*/
                
                if(typeof value === 'object' && !value.__isProxy)
                    value = Settings._addAccessors(value, operation);
                
                debug(`assigning: ${propName}`);
                target[name] = value;
                
                
                debug(`call write: ${propName}`);
                operation();
                debug(`finish set: ${propName}`);
            }
        };

        let proxy = obj3ct.__isProxy ? 
                        obj3ct :
                            new Proxy(obj3ct, handler);

        Object.defineProperty(proxy, '__isProxy', { value: true, enumerable: false });              // use symbol instead
        
        debug(`iterating`);
        Object.entries(obj3ct)                                                                      // entries gives the same looking array whether obj3ct is an object or an array...   // compare: Object.entries({a:1,b:2,c:3}) and Object.entries(['a','b','c'])
              .forEach(([key, value]) =>                                                                // array destructure into variables of arrow function...
                        {
                            if(typeof value === 'object' && !value.__isProxy)                               // if the value is an oject and not yet proxied ...
                                obj3ct[key] = Settings._addAccessors(value, operation);                         // proxy the value and assign it back to its original place
                        });

        debug(`returning ${JSON.stringify(proxy)}`);
        return proxy;
    }


    // --- untestables -----------------------------------------------------

    
    /* istanbul ignore next */
    /**
     * the minumum untestable code for reading the file
     * @param {string} fileName the file to write
     * @param {function} resolver a callback to pass the data to
     */
    static _untestable_readFile(fileName, resolver)
    {
        fs.readFile(fileName, (err, data) =>
        {
            if (err) error(err);
            resolver(data)
        });
    }


    /* istanbul ignore next */
    /**
     * the minumum untestable code for writing the file
     * @param {string} fileName the file to write
     * @param {any} data data to write
     */
    static _untestable_writeFile(fileName, data)
    {
        fs.writeFile(fileName, data, (err) => {
            if (err) error(err);
            debug(`saved ${fileName}`);
        });
    }

    // --- end untestables -------------------------------------------------
}


module.exports = Settings;
