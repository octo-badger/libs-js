# libs-js

Reactive Object Model:
Enables easy creation of reactive data structures (objects, arrays and combinations of both): set handlers for when your data changes.
(works and has tests)

Settings:
An auto-saving data structure (useful for config that automatically persists), subclassed from Reactive Object Model.
(works and has tests, isn't actually subclassed from ROM yet)

Dynamic Ease:
Easing usually interpolates between a starting position and a fixed target, this adaptively eases between the current value and a potentially changing target.
It effectively adds 'momentum' to the vector, but also adaptively accelerates towards the target and slows as the target is approached.
The acceleration / deceleration and max speed are configurable.
This is useful for easily smoothing transitions, such as LED brightness or preventing aggressive changes in servo position.
(works and in use, no tests yet)

StatusValue:
Subclass of Dynamic ease for specific use case of oscillating between an upper an lower value.
(working(?), no tests)

Navi:
Written for fun - when included in an application spawns multiple separate processes that monitor each other and will kill then restart any that become unresponsive.
It will keep your script running until Navi is asked to kill it, but it's probably not the 'correct' approach :)
(works and semi-in use, may be buggy and untested, linux only atm)

SubvertConsole:
Written for fun - allows you to just keep using console logging, but will replace and enrich the existing functionality.
Add tags, redirect output to queue, and in the future send to log aggregating endpoint.
(working-ish... being refactored from working code embedded in another project, features to be added)

SpiQueue:

