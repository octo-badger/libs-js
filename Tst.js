
let debug = info = log = warn = error = ()=>{};

class Tst 
{

    constructor(options) 
    {
        options = this.options = Object.assign(
        { 
            source: () => ({}),                         // return empty operation
            operation: () => 2,
            logger: console
        },
        options);

        /*
        this.source = options.source;
        this.operation = options.operation;
        /*/
        //({source, operation} = options);                                                      // properties undefined :(
        ['source', 'operation'].forEach(prop => this[prop] = options[prop]);
        //*/
        
        ({debug, info, log, warn, error} = options.logger);
    }


    async getModel() 
    {
        return new Promise((resolve, reject) => 
        {
            let result = this.source();
            result['x'] = this.operation();
            setTimeout(() => resolve(result), 100);
        });
    }
}

module.exports = Tst;