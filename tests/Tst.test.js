const Tst = require('../Tst');


test('async test', async () => 
{
    const tst = new Tst();
    let results = await tst.getModel();

    expect(results).toEqual({x: 2});
});