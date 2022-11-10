
const DynamicEase = require('./DynamicEase');
const { safe } = require('./Extensions');


let debug = info = log = warn = error = ()=>{};

class StatusValue extends DynamicEase
{
    constructor(...args) 
    {
        super(...args);

        this.lowerTarget = safe(this.options.clamp.lower, 0);
        this.upperTarget = safe(this.options.clamp.upper, 255);

        this._onComplete = ease => 
        {
            debug(`completed: ${ease.target}`);
            ease.set(ease.target === this.lowerTarget ? 
                        this.upperTarget : 
                            this.lowerTarget);
        };
        
        this.callbacks.onComplete = this._onComplete;
    }


    /**
     * pause easing
     * @param {number} target optional target to ease to before pausing
     */
    pause(target)
    {
        if(target != null) this.set(target);
        this.callbacks.onComplete = ease =>
        {
            ease.reset();
        };
    }


    /**
     * resume
     * @param {number} target optional target to ease to after resuming
     */
    resume(target)
    {
        this.callbacks.onComplete = this._onComplete;
        target != null ?
            this.set(target) :
                this.callbacks.onComplete(this);
    }


    /**
     * set the upper target of oscillation
     * @param {number} upperTarget 
     */
    setUpperTarget(upperTarget)
    {
        this.upperTarget = upperTarget;
    }

    /**
     * set the lower target of oscillation
     * @param {number} lowerTarget 
     */
    setLowerTarget(lowerTarget)
    {
        this.lowerTarget = lowerTarget;
    }
}

module.exports = StatusValue;
