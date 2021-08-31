
//exports.id = 'DynamicEase';
let debug = info = log = warn = error = ()=>{};

class DynamicEase 
{
    constructor(target, options, callbacks) 
    {
        options = this.options = Object.assign(
        { 
            logger: console,
            initial: 0,
            maxChangePerSec: 1000, 
            acc: 0.3, 
            stepMillis: 20,
            clamp: { lower: null, upper: null},
            round: false
        },
        options);
        
        this.callbacks = Object.assign(
        { 
            onUpdate: () => {},
            onComplete: null 
        },
        callbacks);

        let stepsPerSec = (1000 / options.stepMillis);
        
        ({debug, info, log, warn, error} = options.logger);
        this.vector = 0;
        //this.stepMillis = 20;
        this.token = null;
        this.pos = options.initial;                                                           // start position
        this.maxSpeed = options.maxChangePerSec / stepsPerSec;
        this.acc = options.acc / stepsPerSec;

        console.log(`max speed: ${this.maxSpeed} / acceleration: ${this.acc} / steps/s: ${stepsPerSec}`);
        
        //this.target = target;
        this.set(target);
    }

    set(target) 
    {
        clearInterval(this.token);
        this.target = target;

        //this.token = setInterval(this.loop, this.stepMillis);
        this.token = setInterval(() => this.loop(), this.options.stepMillis);
    }

    loop()
    {
        let { vector, maxSpeed, acc } = this;
        let { onUpdate, onComplete } = this.callbacks;

        let resistance = ((vector / maxSpeed) * acc);									// resistance tends towards acc as speed tends towards maxSpeed
        let ac = acc - resistance; 													    // resistance should balance out the acceleration

		let dist = this.target - this.pos;                                              // distance to target

        // console.log(`vector: ${vector} :: dist: ${dist}`);

        // if(Math.abs(vector) < 1 && Math.abs(dist) < 1)
        if(Math.abs(dist) < 1)
        {
            this.vector = 0;
            this.pos = this.target;

            //console.log('completed');
            clearInterval(this.token);
            onComplete && onComplete(this);
        }
        else
        {
            let minDist = ((vector * (acc + vector)) / (2 * acc)) + (acc*3);
            
            this.vector += (minDist < Math.abs(dist) || (vector > 0 != dist > 0)) ?						// if we're outside the breaking distance OR the vector is heading away from the target (the vector is towards the target when it and dist are of the same sign) ...
                                this.absConstrain(dist, ac) :									            // ... accelerate based on the distance up to the value of ac  
                                    this.absConstrain(dist * -1, acc);								            // ... ELSE decelerate
            
            //(this.vector > this.maxSpeed) && (this.vector = this.maxSpeed);
            this.vector = this.absConstrain(this.vector, maxSpeed);
            this.pos += this.vector;
            ////console.info('loop-' + this.vector + " :: " + this.pos);
            
            let { clamp, round } = this.options;

            this.pos = clamp.upper != null && (this.pos > clamp.upper) ? clamp.upper :
                        clamp.lower != null && (this.pos < clamp.lower) ? clamp.lower :
                            this.pos;

            let pos = round ? 
                        Math.round(this.pos) :
                            this.pos;

            onUpdate(pos);
        }
    }

    reset()
    {
        clearInterval(this.token);
        this.pos = this.target;
        this.vector = 0;
    }

    update(callback)
    {
        this.callbacks.onUpdate = callback;
    }

    absConstrain(val, limit)
    {
        limit = Math.abs(limit);                            // get abs limit
        let negLimit = limit * -1;                          // get negative limit
        return (val > limit ?                               // if value is greater than positive limit ... 
                    limit :                                     // ... return positive limit
                        (val < negLimit ?                           // if val is less than negative limit ...
                            negLimit :                                  // ... return negative limit
                                val));                                      // ... otherwise just return the unconstrained value 
    }
}


/*
exports.DynamicEase = DynamicEase;
/*/
module.exports = DynamicEase;
//*/
