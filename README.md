# libs-js

Reactive Object Model:
Enables easy creation of reactive data structures (objects, arrays and combinations of both): set handlers for when your data changes.

Settings:
An auto-saving data structure (useful for config that automatically persists), subclassed from Reactive Object Model.

Dynamic Ease:
Easing usually interpolates between a starting position and a fixed target, this adaptively eases between the current value and a potentially changing target.
It effectively adds 'momentum' to the vector, but also adaptively accelerates towards the target and slows as the target is approached.
The acceleration / deceleration and max speed are configurable.
This is useful for easily smoothing transitions, such as LED brightness or preventing aggressive changes in servo position.

