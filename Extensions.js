

let safe = (func, d3fault) => 
            { 
                result = d3fault;
                try 
                { 
                    let r = func();
                    if(r != null) result = r;
                } 
                catch {} 
                return result;
            };

module.exports = { safe };
