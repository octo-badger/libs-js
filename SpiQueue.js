

class SpiQueue 
{
    constructor(spi, bufferLogCallback) 
    {
        this.spi = spi;
        this.bufferLogCallback = bufferLogCallback; // optional sink for the interleaved transfer buffer

        this.queue = [];
        this.started = false;
        this.newOperationResolver = null; // potential reference to a resolver function
    }


    /**
     * Start processing queue items.
     * Handles the current and previous operations, setting up the transfer
     */
    async go() 
    {
        this.started = true; // flag queue as started
        console.log('starting queue');
        let previousOperation = null;

        while (this.started) // screaming loop! ...
        {
            let operation = await this.next(); // try to get the next operation (non-blockingly waits for one if the queue is empty)
            console.debug(`got ${operation.str()}`);

            if (operation.functionPayload) 
            {
                await operation.payload(this.spi);

                // await operation.payload(this.spi, previousOperation);                                                // should it also accept the previousOperation?
                // previousOperation = operation;
            }
            else 
            {
                await this.transfer(operation, previousOperation, this.spi);
                previousOperation = operation;
            }
        }
    }


    /**
     *
     * @param {Operation} operation the operation to add to the queue
     */
    async add(operation) 
    {
        console.debug(`adding ${operation.str()} :: (has newOperationResolver: ${this.newOperationResolver !== null})`);
        this.queue.push(operation); // push the operation onto the queue

        if (this.newOperationResolver) // if there's a stored resolver, there wasn't an operation last time next was called, so ...
        {
            this.newOperationResolver(this.queue.shift()); // call the resolver with the operation to process
            this.newOperationResolver = null; // clear the stored resolver
        }
    }

    /*
    async completionOf(operation)
    {
        /// await completionOf(operation) - blocks until the passed operation has completed?
        /// may not be necessary as the queue will pause when no new operations are available
    }
    //*/
    /**
     * Transfer those pesky bytes
     * Handles spi transfer and routing bytes to the correct operations
     * @param {Operation} operation current operation to process
     * @param {Operation} previousOperation the previous operation - may be waiting for data
     * @param {piSpi} spi the spi bus object
     */
    async transfer(operation, previousOperation, spi) 
    {
        let name = operation.name ? ` ${operation.name}:` : '';
        console.log(`transferring${name} ${operation.payload.toString('hex')} bytes`);
        let transferring = true;

        //while(transferring && this.started)
        {
            await new Promise((resolve, reject) => {
                console.debug('in promise');

                try {
                    spi.transfer(operation.payload, (err, inBuf) => {
                        console.debug('written ' + operation.payload.toString('hex'), err);
                        err && reject();

                        this.saveBuf(operation.payload, inBuf);
                        inBuf.subarray().forEach((byte, i) => // iterate the bytes in retrieved buffer ...
                        {
                            // slightly wrong - first operation will br passed the bytes that are read which really belong to no-one ... but perhaps this is a good thing? better than them just being discarded?
                            if (previousOperation && previousOperation.result(byte)) {
                                previousOperation = null;
                            } else {
                                transferring = transferring && operation.result(byte); // if transferring is still true, pass the byte to the operation and update the transferring flag (this allows the operation to)
                            }
                        });
                        resolve();
                    });
                }
                catch (e) {
                    console.log('error', e);
                    reject();
                }
            });
            console.debug('after promise');
        }
    }


    /**
     * (internal) Gets the next queued operation (or the promise of the next one when it's added)
     */
    async next() 
    {
        return new Promise(resolve => // create and return a new Promise, which ...
        {
            console.debug(`queue length: ${this.queue.length}`);

            this.queue[0] ? // if the queue has an operation ready for processing ...
                resolve(this.queue.shift()) : // return that operation immediately ...
                this.newOperationResolver = resolve; // ELSE store the resolver for a future operation
        });
    }


    /**
     * stop the queue, I'm getting off
     */
    async stop() 
    {
        console.log('stopping queue');
        this.started = false;
    }


    /**
     * spi reads a byte for every written, and conversely writes a byte when reading a byte - this interleaves the two buffers as write/read pairs and appends to fileName
     * @param {Buffer} outBuf written bytes
     * @param {Buffer} inBuf read bytes
     */
    saveBuf(outBuf, inBuf) 
    {
        if (this.bufferLogCallback) 
        {
            if (outBuf.length !== inBuf.length) // if the buffer lengths differ ...
            {
                console.error(`buffer length mismatch: outBuf(${outBuf.length}) / inBuf(${inBuf.length})`); // complain - in and out buffers need to be the same length
            }

            let interleavedBuf = Buffer.alloc(outBuf.length * 2); // create a buffer twice the length of the in/out buffers - big enough for all data
            outBuf.subarray().forEach((outByte, i) => // iterate the bytes in the out buffer ...
            {
                let j = (i * 2); // create an index for where this byte pair should sit
                interleavedBuf.writeUInt8(outByte, j); // write the written byte in position one
                interleavedBuf.writeUInt8(inBuf[i], j + 1); // write the read byte in position two
            });

            this.bufferLogCallback(interleavedBuf);
        }
    }

}



class Operation
{
    /**
     * General operation constructor
     * @param {Buffer} payload binary data to send (reads must also send data)
     * @param {function} callback callback to send received data to
     */
    constructor(payload, callback, name)
    {
        this.payload = payload;
        this.callback = callback;
        this.name = name;
        this.functionPayload = typeof(payload) === 'function';
    }


    /**
     * could return true if complete, then queue reference wouldn't be needed
     * @param {*} byte 
     */
    result(byte)
    {
        let name = this.name ? ` for ${this.name}` : '';
        console.log(`resulting byte${name}: ${byte.toString(16)}`);
        let complete = this.callback(byte);
        let keepTransferring = complete !== true;
        return keepTransferring;
    }


    str()
    {
        let name = this.name ? `'${this.name}' ` : '';
        let msg = `operation ${name}` + this.functionPayload ?
                                            '(function)' :
                                                `${this.payload.length} bytes: ${this.payload.toString('hex')}`;
        return msg;
    }
}

 

exports.SpiQueue = SpiQueue;
exports.Operation = Operation;
