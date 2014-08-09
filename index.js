var ObservArray = require('observ-array')
var ObservGrid = require('observ-grid')
var Observ = require('observ')
var Through = require('through')

module.exports = function MidiGrid(mapping, midiStream){

  var currentOutputValues = {}
  var shape = mapping.shape

  var self = ObservGrid([], mapping.shape, mapping.stride)
  self.state = ObservGrid([], mapping.shape, mapping.stride)
  self.base = ObservGrid([], mapping.shape, mapping.stride)

  // set up start values
  var length = shape[0] * shape[1]
  for (var r=0;r<shape[0];r++){
    for (var c=0;c<shape[1];c++){
      self.set(r,c, Observ(0)),
      self.state.set(r,c, ObservArray([])),
      self.base.set(r,c, ObservArray([Observ(0)]))
    }
  }

  self.pushBase = function(row, col, value){
    var val = Observ(value)
    var cell = self.base.get(row, col)
    cell.push(val)
    return function release(){
      var index = cell.indexOf(val)
      if (~index){
        cell.splice(index, 1)
      }
    }
  }

  self.pushState = function(row, col, value){
    if (row >= 0 && row < shape[0] && col >= 0 && col < shape[1]){
      var val = Observ(value)
      var cell = self.state.get(row, col)
      cell.push(val)
      return function release(){
        var index = cell.indexOf(val)
        if (~index){
          cell.splice(index, 1)
        }
      }
    }
  }

  self.flash = function(row, col, value, ms){
    var release = self.pushState(row, col, value)
    setTimeout(release, ms || 100)
  }

  self.midiStream = Through(function(data){
    var key = data[0] + '/' + data[1]
    var coords = mapping.lookup(key)
    if (coords){
      self.set(coords[0], coords[1], data[2])
    }
  })

  if (midiStream){ // duplex midi!
    midiStream.pipe(self.midiStream).pipe(midiStream)
  }

  var releases = [
    self.state(refreshOutput),
    self.base(refreshOutput)
  ]

  return self

  // scoped

  function refreshOutput(){
    for (var r=0;r<mapping.shape[0];r++){
      for (var c=0;c<mapping.shape[1];c++){
        var state = self.state.get(r,c)
        var base = self.base.get(r,c)
        var midi = mapping.get(r,c)
        if (midi){
          var message = midi.split('/').map(function(x){ return parseInt(x)})
          var res = null
          if (state && state.getLength()){
            message.push(state.get(state.getLength()-1)())
          } else {
            message.push(base.get(base.getLength()-1)())
          }
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