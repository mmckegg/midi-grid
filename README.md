midi-grid
===

Map a duplex midi stream to [observable](https://github.com/raynos/observ) input and output value [grids](https://github.com/mmckegg/observ-grid).

For modelling grid midi controllers such as the Launchpad.

## Install via [npm](https://npmjs.org/package/midi-grid)

```js
$ npm install midi-grid
```

## API

```js
var MidiGrid = require('midi-grid')
```

### `var midiGrid = MidiGrid(duplexMidiStream, mapping[, outputGrid])`

Create an [observable](https://github.com/mmckegg/observ-grid) instance of MidiGrid. 

Pass in a `duplexMidiStream` such as [web-midi](https://github.com/mmckegg/web-midi) or [midi-stream](https://github.com/mmckegg/midi-stream).

`mapping` is an [array-grid](https://github.com/mmckegg/array-grid) containing the midi to map (e.g. `"144/36"`).

Optionally pass in `outputGrid` - an observable grid for setting output values as [observ-grid](https://github.com/mmckegg/observ-grid) or [observ-grid-stack](https://github.com/mmckegg/observ-grid-stack) for layering grids.


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

var launchpad = MidiGrid(duplexPort, mapping)

launchpad(function(grid){
  // grid is an immutable instance of ArrayGrid with coords mapped to current values
  if (grid._diff){
    var coords = grid._diff[0]
    var key = coords[0] + '/' + coords[1]
    var value = grid._diff[2]
    if (value){
      triggerOn(coords, value)

      // turn on light
      launchpad.set(coords[0], coords[1], 127)
    } else {
      triggerOff(coords)

      // turn off light
      launchpad.set(coords[0], coords[1], 0)
    }
  }
})
```

### `midiGrid.get(row, col)`

Get the current input value of the given coordinates.

### `midiGrid.set(row, col, value)`

Alias for `output.set(row, col, value)`. Sets the output value at the given coordinates.

### `midiGrid.resend()`

Resend all the current output values. Use if you switch the output device and want to resend all state.

### `midiGrid.midiStream (Duplex Stream)`

This midi stream is connected to the constructor `duplexPort` if specified, otherwise it can be manually piped to and from a midi device.

## [Observable Attributes](https://github.com/raynos/observ)

### `midiGrid`

Notifies when any input value changes (e.g. a button is pressed/released). 

### `midiGrid.output` ([ObservGrid](https://github.com/mmckegg/observ-grid) or custom observ passed to ctor)

Notifies when any output value changes (e.g. light up button). Set output values using `midiGrid.output.set(row, col, val)` or use the alias `midiGrid.set`.