import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'
import { RhinoCompute } from 'https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js'

require(["esri/Map", "esri/views/SceneView", "esri/layers/GraphicsLayer","esri/widgets/Sketch/SketchViewModel","esri/layers/support/FeatureFilter","esri/geometry/geometryEngine", "esri/Graphic","esri/layers/FeatureLayer","esri/widgets/Measurement","esri/Ground", "esri/geometry/Polygon"], 
(Map, SceneView, GraphicsLayer, SketchViewModel, FeatureFilter, geometryEngine, Graphic, FeatureLayer, Measurement, Ground, Polygon) => {
  setupLayers(FeatureLayer, GraphicsLayer)
  setupMap(Map, SceneView, Ground)
  setupWidgets(Measurement)
  setupSketch(SketchViewModel, FeatureFilter, Graphic, geometryEngine)

  document.getElementById("actionButton").addEventListener("click", () => {
    if (state == 0){
      if (currentPolygon != undefined){
        if (pointOne != undefined){
          toState2()
        } else {
          toState1()
        }
        savedPolygon = currentPolygon
        savedPolygonGraphic = currentPolygonGraphic
      } else {
        alert("Please draw a polygon first")
      }
    } else if (state == 1){
      if (pointOne != undefined && pointTwo != undefined){
        toState2()
      } else {
        alert("Please select 2 access points")
      }
    } else if (state == 2) {
      if (document.getElementById("pRoad").value + document.getElementById("sRoad").value > 100){
        alert("Primary roads and secondary roads percentage should add up to AT MOST 100%")
      } else {
        toState3()
        document.getElementById("actionButton").disabled = true;
        useRoadData(RhinoCompute, displaySlot)
      }
    } else if (state == 3) {
      document.getElementById("popup").style.display = "block"
      document.getElementById("resetPrompt").style.display = "block"
      popup = true
    }
  })

  // Utility functions with ArcGIS / imported inputs
  function displaySlot(slot){
    processData(saveData[slot]['raw'], slot)
    processInArcGIS(Graphic, Polygon, saveData[slot]['raw'], slot)
    updateGraphicDisplay(slot)
  }

  // Init Rhino
  rhino3dm().then( async m => {
    console.log( 'Loaded rhino3dm.' )
    rhino = m // global

    //RhinoCompute.url = 'http://localhost:8081/'; // RhinoCompute server url. Use http://localhost:8081 if debugging locally.
    RhinoCompute.url = "http://13.229.234.243:80/"; // RhinoCompute server url. Use http://localhost:8081 if debugging locally.
    RhinoCompute.apiKey = "0hOfevzxs49OfbXDqyUx" // RhinoCompute server api key. Leave blank if debugging locally.

    // load a grasshopper file!
    const url = definitionName
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    const arr = new Uint8Array(buffer)
    definition = arr
  })
});