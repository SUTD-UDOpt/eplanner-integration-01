// Input Components
document.getElementById("clearFilter").addEventListener("click", () => {
  clearEverything()
  state = 0
  savedPolygon = undefined
  savedPolygonGraphic = undefined
  document.getElementById("actionButton").innerHTML = "Process Polygon"
});

// Result Components
// Default offset mode
document.getElementById("treeContainer").style.display = "none"

// For multiple modes
document.getElementById("offsetSol").addEventListener("click", () => {
  document.getElementById("macros").style.display = "block"
  document.getElementById("treeContainer").style.display = "none"
  resetResultDiv()
  parcelViewingMode = "offset"
  parcelLayer.visible = true
  treeLayer.visible = false
})
document.getElementById("treeGen").addEventListener("click", () => {
  document.getElementById("macros").style.display = "none"
  document.getElementById("treeContainer").style.display = "block"
  document.getElementById("treeContainerGen").style.display = "block"
  document.getElementById("treeContainerDepth").style.display = "none"
  resetResultDiv()
  parcelViewingMode = "tree"
  parcelLayer.visible = false
  treeLayer.visible = true
})
document.getElementById("treeDepth").addEventListener("click", () => {
  document.getElementById("macros").style.display = "none"
  document.getElementById("treeContainer").style.display = "block"
  document.getElementById("treeContainerGen").style.display = "none"
  document.getElementById("treeContainerDepth").style.display = "block"
  resetResultDiv()
  parcelViewingMode = "tree"
  parcelLayer.visible = false
  treeLayer.visible = true
})

document.getElementById("finalResetButton").addEventListener("click", (event) => {
  if (document.querySelector('#reset1').checked && document.querySelector('#reset2').checked){
    toState2()
    resetSceneAndData()
    sketchLayer.add(savedPolygonGraphic)
    sketchLayer.add(pointOneGraphic)
    sketchLayer.add(pointTwoGraphic)
  } else if (document.querySelector('#reset1').checked){
    toState1()
    resetSceneAndData()
    clearPoints()
    sketchLayer.add(savedPolygonGraphic)
    pointOne = undefined
    pointTwo = undefined
    pointOneGraphic = undefined
    pointTwoGraphic = undefined
  } else if (document.querySelector('#reset2').checked){
    toState0()
    resetSceneAndData()
    clearPolygon()
    sketchLayer.add(pointOneGraphic)
    sketchLayer.add(pointTwoGraphic)
    savedPolygon = undefined
    savedPolygonGraphic = undefined
  } else {
    toState0()
    clearEverything()
    pointOne = undefined
    pointTwo = undefined
    pointOneGraphic = undefined
    pointTwoGraphic = undefined
    savedPolygon = undefined
    savedPolygonGraphic = undefined
  }
  document.getElementById("popup").style.display = "none"
  document.getElementById("resetPrompt").style.display = "none"
  popup = false
})

// UI State Management Functions
function toState0() {
    state = 0
    markingParcels = false
    setComponentDisplay([0, 1, 0, 1, 2])
    document.getElementById("actionButton").innerHTML = "Select Boundary Polygon"
}

function toState1() {
    state = 1
    markingParcels = false
    setComponentDisplay([0, 2, 1, 0, 2])
    document.getElementById("actionButton").innerHTML = "Select Access Point Pair"
}

function toState2() {
    state = 2
    markingParcels = false
    setComponentDisplay([0, 2, 0, 0, 1])
    document.getElementById("actionButton").innerHTML = "Solve"
    }

function toState3() {
    state = 3
    markingParcels = false
    setComponentDisplay([2, 0, 0, 0, 0])
    document.getElementById("actionButton").innerHTML = "Reset"
    document.getElementById("resultA").style.display = "block"
    document.getElementById('loader').style.display = 'block'
}

function setComponentDisplay(arr){
  let components = [
  document.getElementById("resultDiv"), 
  document.getElementById("clearFilter"),
  document.getElementById("point-geometry-button"),
  document.getElementById("polygon-geometry-button"),
  document.getElementById("sliderContainer")]

  for (let i=0; i<5; i++){
    if (arr[i] == 0){
      components[i].style.display = "none"
    } else if (arr[i] == 1){
      components[i].style.display = "block"
    }
  }
}

function emptyScores() {
  document.getElementById("text1").innerHTML = "Parcel key: "
  document.getElementById("text2").innerHTML = "Parcel depth: "
  document.getElementById("text3").innerHTML = "Parcel area: "
  document.getElementById("text4").innerHTML = "Orientation: "
  document.getElementById("text5").innerHTML = "Elongation: "
  document.getElementById("text6").innerHTML = "Compactness: "
  document.getElementById("text7").innerHTML = "Convexity: "
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}

function clearScene(){
  parcelLayer.removeAll()
  treeLayer.removeAll()
  baseLayer.removeAll()
}

function resetSceneAndData(){
  dataCol = {}
  dataTree = {}
  depthTree = {}
  buildingData = undefined
  selectedKey = undefined
  pointedKey = undefined
  markedParcels = []
  markingParcels = false
  parcelViewingMode = "offset"
  document.getElementById("treeContainer").style.display = "none"
  clearScene()
  emptyScores()
}

// DATA RELATED FUNCTIONS
function truncate(num){
  return Math.round(num*1000) / 1000
}

// Utility functions data storage related
function updateGraphicDisplay(slot){
  selSlot = slot
  savedPolygonGraphic = saveData[slot]['arcgis']['polygon']
  pointOneGraphic = saveData[slot]['arcgis']['pointone']
  pointTwoGraphic = saveData[slot]['arcgis']['pointtwo']
  if (savedPolygonGraphic != undefined){savedPolygon = saveData[slot]['arcgis']['polygon'].geometry}
  if (pointOneGraphic != undefined){pointOne = saveData[slot]['arcgis']['pointone'].geometry}
  if (pointTwoGraphic != undefined){pointTwo = saveData[slot]['arcgis']['pointtwo'].geometry}
  clearPoints()
  sketchLayer.add(saveData[slot]['arcgis']['pointone'])
  sketchLayer.add(saveData[slot]['arcgis']['pointtwo'])
}