

exports.id = 'intervalz';

let tokens = new Set();


exports.add = (action, period) => 
{
    let token = setInterval(action, period);
    tokens.add(token);
    return token;
};

exports.clear = (token) =>
{
    tokens.delete(token);
    clearInterval(token);
}

exports.clearAll = () =>
{
    tokens.forEach(token => clearInterval(token));
    tokens.clear();
}