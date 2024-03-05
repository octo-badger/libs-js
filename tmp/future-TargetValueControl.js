/*

digital input adaptive delta

module to track delta in a value and vary binary on / off to seek equalibrium at a target value

the idea is to be given a target value and control of on / off (possibly a configurable range) and a feed back of current value
and the module will calculate the delta and adapt its application of (on / off) to sneak up on the target value with minimal overshoot


Could track the change for a given time spent in the 'on' state (maintain a map of recorded changes? Perhaps create a new entry every time the delta(?) changes by >10%?)

*/