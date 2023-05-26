// ArcGIS sketch init
let currentPolygon = undefined
let savedPolygon = undefined
let pointOne = undefined
let pointTwo = undefined
let currentPolygonGraphic, savedPolygonGraphic, pointOneGraphic, pointTwoGraphic

// Other ArcGIS vars
let view
let featureRenderer, buildingLayer, sketchLayer, bufferLayer, parcelLayer, treeLayer, baseLayer, map;
let featureLayerView, sketchViewModel, eventInfo, featureFilter, sketchGeometry
let measurement
let bufferSize = 0;
let filterGeometry = null;
let highlightedParcel = null;

// General app wide state vars
let state = 0
let popup = false
let parcelViewingMode = "offset"
let markingParcels = false
let currsel = undefined

// General app wide data vars
// all data is already in dataCol, the parcels & outlines are there for easier access to just the meshes
let visibleTreeParcel = {}
let dataCol = {}
let dataTree = {}
let depthTree = {}
let buildingsColl = []
let setbacksColl = []
let buildingData = undefined
let base
let newRes
let optFin = false
let errorlog = false

let saveSlotNum = 5
let selSlot
let saveSlots = ["current", undefined, undefined, undefined, undefined]
let savePolygon = [undefined, undefined, undefined, undefined, undefined]
let saveData = {0: {'empty': true}, 1: {'empty': true}, 2: {'empty': true}, 3: {'empty': true}, 4: {'empty': true}}

// Compute related vars
let rhino, definition
const definitionName = 'static/gh/Parcellation.gh'