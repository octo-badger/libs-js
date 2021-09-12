const Settings = require('../Settings');

let fileReads = {};                                                                             // map of data that can be read by the test subject
let savePromiseFor = {};                                                                        // map of promises (allows us to await what is usually a fire-and-forget async operation)
let resolveFor = {};                                                                            // map of resolve functions for the above promises


/**
 * replace untestable parts of the test subject (file-system calls)
 */
beforeAll(() => 
{
    Settings._untestable_readFile = (fileName, resolver) => resolver(fileReads[fileName]);          // return whatever is in the fileReads map for the passed fileName
    Settings._untestable_writeFile = (fileName, data) => resolveFor[fileName](data);                // alter static writeFile - resolve the promise with the data for the written fileName
});


/**
 * add test hooks for simulating reading and writing
 * @param {string} fileName the fileName (not a real file - just a test ID really)
 * @param {string} fileData serialised file data JSON
 * @returns the fileName passed through for calling simplicity
 */
function addHooks(fileName, fileData)
{
    // TODO: should probably test for fileName uniqueness
    fileReads[fileName] = fileData;                                                                 // store the data that will be 'read' from the file of this name
    savePromiseFor[fileName] = new Promise(resolve =>                                               // store a promise that we can await for the saved data
                                                resolveFor[fileName] = resolve);                        // store a resolver function that can be called by the test subject's writeFile callback
    return fileName;
}

// afterAll(() => 
// {
//     console.log("afterAll called");
// });


test('simple test', async () => 
{
    let fileName = addHooks('simple.file', '{}');

    const settings = new Settings({ logger: null });
    let config = await settings.load(fileName);

    expect(config).toEqual({});

    config.x = 1;

    expect(await savePromiseFor[fileName]).toEqual(`{\n\t"x": 1\n}`);
});