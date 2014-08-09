var MidiStream = require('midi-stream')
var ArrayGrid = require('array-grid')
var MidiGrid = require('./')

var duplexPort = MidiStream('Launchpad Mini 2')
var mapping = ArrayGrid([], [8,8])
var columnMajor = ArrayGrid([], [8,8], [1, 8])

for (var r=0;r<8;r++){
  for (var c=0;c<8;c++){
    var launchpadButtonId = (r * 16) + c
    mapping.set(r, c, '144/' + launchpadButtonId)
  }
}

var launchpad = MidiGrid(mapping, duplexPort)

var posRow = 0
var posCol = 0
var posCircle = 0
var colorsRow = [13, 60, 13]
var colorsCol = [28, 15, 28]
var colorsCircle = [63, 62, 29]

var circle = [
  [-2,-2],
  [2,2],
  [-2,2],
  [2,-2],

  [-1,-1],
  [1,1],
  [-1,1],
  [1,-1],

  [0,0],
]
var releases = []
var circleReleases = []

var down = []
launchpad(function(values){
  if (values._diff){
    var coords = values._diff[0]
    var key = coords[0] + '/' + coords[1]
    if (values._diff[2]){
      for (var r=coords[0]-1;r<=coords[0]+1;r++){
        for (var c=coords[1]-1;c<=coords[1]+1;c++){
          circleReleases.push(launchpad.pushState(r, c, 0))
        }
      }
      down.push(key)
    } else {
      down.splice(down.indexOf(key), 1)
    }
  }
})

function stepRow(){
  var color = Math.floor(posRow / 64) % colorsRow.length
  var coords = launchpad.coordsAt(posRow % 64)
  releases.push(launchpad.pushBase(coords[0], coords[1], colorsRow[color]))
  posRow += 1
}

function stepCol(){
  var color = Math.floor(posCol / 64) % colorsCol.length
  var coords = columnMajor.coordsAt(posCol % 64)
  releases.push(launchpad.pushBase(coords[0], coords[1], colorsCol[color]))
  posCol += 1
}

function encircle(){
  var offset = circle[posCircle % circle.length]
  launchpad.data().forEach(function(value, i){
    if (value){
      var coords = launchpad.coordsAt(i)
      circleReleases.push(
        launchpad.pushState(
          coords[0] + offset[0], 
          coords[1] + offset[1], 
          colorsCircle[Math.floor(posCircle / circle.length) % colorsCircle.length] 
        )
      )
    }
  })

  if (!down.length){
    var index = Math.floor(circleReleases.length * Math.random())
    if (circleReleases[index]){
      circleReleases[index]()
      circleReleases.splice(index, 1)
    }
  }

  posCircle += 1
}

function die(){
  if (Math.random() < 0.9){
    var index = Math.floor(releases.length * Math.random())
    if (releases[index]){
      releases[index]()
      releases.splice(index, 1)
    }
  }
}

setInterval(stepRow, 40)
setInterval(stepCol, 40)
setInterval(encircle, 20)

setInterval(die, 16)
