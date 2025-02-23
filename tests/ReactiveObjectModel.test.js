const ROM = require('../ReactiveObjectModel');


test('simplest reactive object', async () => 
{
    let operationCalls = 0;

    let testOp = (data, target, name) =>
    {
        operationCalls++;
        expect(data).toEqual({x: 2});
        expect(target).toEqual({x: 2});                                                 // target has been updated by this point... target will potentially be a sub-tree of the full data
        expect(name).toEqual('x');
    }

    const rom = new ROM({ operation: testOp });
    let data = await rom.getModel();

    expect(data).toEqual({});

    data.x = 2;
    expect(operationCalls).toEqual(1);
    expect(data).toEqual({x: 2});
});


test('nested reactive object', async () => 
{
    let operationCalls = 0;

    let testOp = (data, target, name) =>
    {
        operationCalls++;
        expect(data).toEqual({ x: { y: { z: { noo: 2} } } });
        expect(target).toEqual({ noo: 2});                                                              // target is a sub-tree of the full data
        expect(name).toEqual('noo');
    }

    const rom = new ROM({   
                            defaultData: { x: { y: { z: {} } } }, 
                            operation: testOp
                        });
    let data = await rom.getModel();

    expect(data).toEqual({ x: { y: { z: {} } } });

    data.x.y.z.noo = 2;
    expect(operationCalls).toEqual(1);
    expect(data).toEqual({ x: { y: { z: { noo: 2} } } });
});


test('complex object added to complex object still has reactive leaves', async () => 
{
    let operationCalls = 0;

    let testOp = (data, target, name) =>
    {
        operationCalls++;
        if(operationCalls === 1)
        {
            expect(data).toEqual({ x: { y: { z: { noo: { a: { b: { c: { d: 3 } } } } } } } });
            expect(target).toEqual({ noo: { a: { b: { c: { d: 3 } } } } });                                 // target is a sub-tree of the full data
            expect(name).toEqual('noo');
        }
        else if (operationCalls === 2)
        {
            expect(data).toEqual({ x: { y: { z: { noo: { a: { b: { c: { d: 4 } } } } } } } });
            expect(target).toEqual({ d: 4 });                                                               // target is a sub-tree of the full data
            expect(name).toEqual('d');
        }
    }

    const rom = new ROM({   
                            defaultData: { x: { y: { z: {} } } }, 
                            operation: testOp
                        });
    let data = await rom.getModel();

    expect(data).toEqual({ x: { y: { z: {} } } });

    data.x.y.z.noo = { a: { b: { c: { d: 3 } } } };
    expect(operationCalls).toEqual(1);
    expect(data).toEqual({ x: { y: { z: { noo: { a: { b: { c: { d: 3 } } } } } } } });
    
    data.x.y.z.noo.a.b.c.d = 4;
    expect(operationCalls).toEqual(2);
    expect(data).toEqual({ x: { y: { z: { noo: { a: { b: { c: { d: 4 } } } } } } } });
});


test('simple reactive array', async () => 
{
    let operationCalls = 0;

    let testOp = (data, target, name) =>
    {
        operationCalls++;
        expect(data).toEqual([2]);
        expect(target).toEqual([2]);
        expect(name).toEqual('0');                                                      // 0 index when pushing to an empty array
    }

    const rom = new ROM({ defaultData: [], operation: testOp });
    let data = await rom.getModel();

    expect(data).toEqual([]);

    data.push(2);
    expect(operationCalls).toEqual(1);
    expect(data).toEqual([2]);
});