var ObservArray = require('observ-array')
var ObservGrid = require('observ-grid')
var Observ = require('observ')
var Through = require('through')

module.exports = function MidiGrid(midiStream, mapping, outputGrid){

  var currentOutputValues = {}
  var shape = mapping.shape

  var self = ObservGrid([], mapping.shape, mapping.stride)
  self.output = outputGrid || ObservGrid([], mapping.shape, mapping.stride)

  // remap exported set to output
  var set = self.set
  self.set = self.output.set.bind(self.output)

  self.midiStream = Through(function(data){
    var key = data[0] + '/' + data[1]
    var coords = mapping.lookup(key)
    if (coords){
      set(coords[0], coords[1], data[2])
    }
  })

  if (midiStream){ // duplex midi!
    midiStream.pipe(self.midiStream).pipe(midiStream)
  }

  var releases = [
    self.output(refreshOutput)
  ]

  return self

  // scoped

  function refreshOutput(){
    for (var r=0;r<mapping.shape[0];r++){
      for (var c=0;c<mapping.shape[1];c++){
        var value = self.output.get(r,c)
        var midi = mapping.get(r,c)
        if (midi){
          var message = midi.split('/').map(pint)
          value = (typeof value == 'function') ? value() : value
          message.push(value || 0)
          write(message)
        }
      }
    }
  }

  function write(message){
    // write thru cache
    var key = message[0] + '/' + message[1]
    var current = currentOutputValues[key]
    if (current !== message[2]){
      self.midiStream.queue(message)
      currentOutputValues[key] = message[2]
    }
  }
}

function pint(i){
  return parseInt(i)
}