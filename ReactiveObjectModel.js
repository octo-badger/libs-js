
//exports.id = 'ReactiveObjectModel';

//let debug = info = log = warn = error = ()=>{};

class ROM 
{

    constructor(options) 
    {
        console.debug(`in ROM constructor()`, 'rom', 'low');

        options = this.options = Object.assign(
        { 
            //source: () => ({}),                         // default: return empty object
            source: null,                               // a function that will return the default data -                           default: null source means defaultData will be used (source is a more advanced use case)
            operation: () => {},                        // the custom operation that will be called when a property is updated  -   default: do nothing
            defaultData: {},
            //logger: console
        },
        options);

        /*
        this.source = options.source;
        this.operation = options.operation;
        /*/
        //({source, operation} = options);                                                      // properties undefined :(
        ['source', 'operation'].forEach(prop => this[prop] = options[prop]);
        //*/
        this.data = null;
        
        
        /*
        options.logger && ({debug, info, log, warn, error} = options.logger);
        /*/
    }


    async getModel() 
    {
        console.debug(`in getModel()`, 'rom', 'low');
        this.data = (this.source && this.source()) 
                        || this.options.defaultData;
                
        this.data = ROM._addAccessors(this.data, (target, name) => this.operation(this.data, target, name));

        return this.data;
    }



    //static #addAccessors(obj3ct)      // private methods unsupported until nodejs v12
    /**
     * pass an object to get its entire heirarchy reactive
     * @param {object} obj3ct preferralby an object?
     * @param {function} operation a function to call when the object structure is modified
     * @returns a proxied object, ready to listen
     */
    static _addAccessors(obj3ct, operation)
    {
        console.debug(`adding accessors to ${JSON.stringify(obj3ct)}`, 'rom', 'low');
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
            set(target, name, value, receiver)                                                  // when a property gets set on our ROM proxy ....
            {
                if(Array.isArray(target) && name === 'length')                                      // we don't care if <array>.length is being set so... (i'm pretty sure it's bad practice to set the length manually? So this should be done by the js runtime as part of a modification triggered by, say, push()).. so...
                    return Reflect.set(...arguments);                                                   // just do the normal thing and return

                /*
                typeof name === "symbol" ?
                    console.debug(`set prop (symbol): ${name.toString()}`) :
                        console.debug(`set prop: ${name}`);
                /*/
                let propName = typeof name === "symbol" ? `(symbol): ${name.toString()}` : name;    // grab the property name        
                console.debug(`set prop: ${propName}`, 'rom', 'low');
                //*/
                
                if(typeof value === 'object' && !value.__isProxy)                                   // if the value to set is a non-proxied object ...
                    value = ROM._addAccessors(value, operation);                                        // ...make it a ROM proxy
                
                console.debug(`assigning: ${propName}`, 'rom', 'low');
                target[name] = value;                                                               // set the value
                
                console.debug(`call write: ${propName}`, 'rom', 'low');
                operation(target, name);                                                            // call the custom operation    // oldValue / newValue / receiver?
                console.debug(`finish set: ${propName}`, 'rom', 'low');
                return true;
            }
        };

        let proxy = obj3ct.__isProxy ?                                                              // if the object is already a proxy ...
                        obj3ct :                                                                        // ... use the proxified object ...
                            new Proxy(obj3ct, handler);                                                     // ... ELSE proxify

        Object.defineProperty(proxy, '__isProxy', { value: true, enumerable: false });              // record whether the object has been proxified (there's no way to tell otherwise) // ideally use symbol instead
        
        console.debug(`iterating`, 'rom', 'low');
        Object.entries(obj3ct)                                                                      // entries gives the same looking array whether obj3ct is an object or an array...   // compare: Object.entries({a:1,b:2,c:3}) and Object.entries(['a','b','c'])
              .forEach(([key, value]) =>                                                                // array destructure into variables of arrow function...
                        {
                            if(typeof value === 'object' && !value.__isProxy)                               // if the value is an oject and not yet proxied ...
                                obj3ct[key] = ROM._addAccessors(value, operation);                              // proxy the value and assign it back to its original place
                        });

        console.debug(`returning ${JSON.stringify(proxy)}`, 'rom', 'low');
        return proxy;
    }

}


module.exports = ROM;
