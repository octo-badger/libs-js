
/**
 * set a default value to return if the function returns null or undefined
 * @param {function} func      
 * @param {any} d3fault 
 * @returns the value returned by the function, or the passed default
 */
function safe(func, d3fault)
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


/**
 * return a padding function configured to pad to the specified width, with the specified padding character. 
 * The function will also convert any passed value to string before padding.
 * @param {string} char 
 * @param {int} num 
 * @returns padding function
 */
function createPad(char, num)
{
    return (value) => (value + '').padStart(num, char);
}


const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

// let pad = (num, i = 2) => (num + '').padStart(i, '0');          // pretty sure this will break in earlier node versions (default parameter values not supported)
let pad = createPad('0', 2);
let pad3 = createPad('0', 3);

/**
 * return formatted timestamp YYYYMMDD-hh:mm:ss.sss
 * @returns timestamp
 */
function timestamp()
{
    let d = new Date();
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${d.toLocaleTimeString('default', timeOptions)}.${pad3(d.getMilliseconds())}`;
}


module.exports = { safe, createPad, timestamp };
