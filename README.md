midi-grid
===

Two way mapping of a midi stream to coordinate grid with stackable states.

## Install via [npm](https://npmjs.org/packages/midi-grid)

```js
$ npm install midi-grid
```

## API

```js
var MidiGrid = require('midi-grid')
```

### var midiGrid = MidiGrid(mapping, midi)

Create an [observable](https://github.com/mmckegg/observ-grid) instance of MidiGrid. 

`mapping` is an [array-grid](https://github.com/mmckegg/array-grid) containing the midi to map (e.g. `"144/36"`).

`midi` is a duplex midi stream such as [web-midi](https://github.com/mmckegg/web-midi) or [midi-stream](https://github.com/mmckegg/midi-stream).

```js
// observe Novation Launchpad button grid
var MidiStream = require('midi-stream')
var duplexPort = MidiStream('Launchpad Mini')
var mapping = ArrayGrid([], [8,8])

for (var r=0;r<8;r++){
  for (var c=0;c<8;c++){
    var launchpadButtonId = (r * 16) + c
    mapping.set(r, c, '144/' + launchpadButtonId)
  }
}

var launchpad = MidiGrid(mapping, duplexPort)
var lightReleases = {}

launchpad(function(grid){
  // grid is an immutable instance of ArrayGrid with coords mapped to current values
  if (grid._diff){
    var coords = grid._diff[0]
    var key = coords[0] + '/' + coords[1]
    var value = grid._diff[2]
    if (value){
      triggerOn(coords, value)

      // turn on light
      lightReleases[key] = launchpad.pushState(coords[0], coords[1], 127)
    } else {
      triggerOff(coords)

      // turn off light
      lightReleases[key]()
    }
  }
})
```

### var release = midiGrid.pushBase(row, col, value)

Add a base output value to the stack. `release()` reverts to value below in stack.

`pushBase` and `pushState` work the same way except that `pushState` take priority of the other.

### var release = midiGrid.pushState(row, col, value)

Add an output value to the stack. `release()` reverts to value below in stack or falls back to base stack if none.

`pushBase` and `pushState` work the same way except that `pushState` take priority of the other.

### midiGrid.flash(row, col, value, ms)

Add `value` to the stack for the `ms` duration specfied.

### midiGrid.midiStream (Duplex Stream)

This midi stream is connected to the constructor `duplexPort` if specified, otherwise it can be manually piped to and from a midi device.

## Observable Attributes

### midiGrid

### midiGrid.base

### midiGrid.state