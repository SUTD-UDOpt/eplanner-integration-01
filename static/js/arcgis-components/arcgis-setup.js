const parcelFillSymbol = {
    type: "simple-fill",
    color: [240, 240, 240, 0.9],
    outline: {
        color: [211, 132, 80, 1],
        width: 2
    }
};

const parcelHighlightSymbol = {
    type: "simple-fill",
    color: [40, 60, 100, 0.9],
    outline: {
        color: [211, 132, 80, 1],
        width: 2
    }
};

const parcelGreenSymbol = {
    type: "simple-fill",
    color: [60, 100, 60, 0.9],
    outline: {
        color: [211, 132, 80, 1],
        width: 2
    }
};

const baseFillSymbol = {
    type: "simple-fill",
    color: [255, 255, 255, 0.9],
    outline: {
        color: [255, 255, 255],
        width: 1
    }
};
function setupLayers(FeatureLayer, GraphicsLayer){
    // Renderer for feature layer to extrude feature (also possible to extrude by linked data)
    featureRenderer = {
        type: "simple", // autocasts as new SimpleRenderer()
        symbol: {
            type: "polygon-3d", // autocasts as new PolygonSymbol3D()
            symbolLayers: [{
            type: "extrude",  // autocasts as new ExtrudeSymbol3DLayer()
            size: 50,  // 100,000 meters in height
            material: { color: "#a9c6db" }
            }]
        }
    };

    // Create the layer and set the renderer
    buildingLayer = new FeatureLayer({
        url: "https://services5.arcgis.com/s71tOLTNP0DMzrOH/arcgis/rest/services/gis_osm_buildings_permanent/FeatureServer/0",
        opacity: 0.8,
        renderer: featureRenderer
    });

    // add a GraphicsLayer for the sketches and the buffer (this is for sketching)
    sketchLayer = new GraphicsLayer();
    bufferLayer = new GraphicsLayer();

    // add a GraphicsLayer for displaying parcellation results
    parcelLayer = new GraphicsLayer();
    treeLayer = new GraphicsLayer();
    baseLayer = new GraphicsLayer();

    treeLayer.visible = false
}

function setupMap(Map, SceneView, Ground){
    //This is where the tile based map is configured
    map = new Map({
        basemap: "topo-vector",
        //ground: "world-elevation",
        ground: new Ground()
    });

    view = new SceneView({
        container: "viewDiv", // Reference to the scene div created in step 5
        map: map, // Reference to the map object created before the scene
        zoom: 16,
        center: [103.955, 1.35], // Sets the center point of view with lon/lat
        viewingMode: "local",
    });
    window.view = view;
    view.constraints.clipDistance.near = 100
    view.constraints.clipDistance.far = 175000

    view.map.addMany([buildingLayer, bufferLayer, sketchLayer, parcelLayer, treeLayer, baseLayer]);

    // create the layerView's to add the filter
    featureLayerView = null;

    // loop through webmap's operational layers
    view.map.layers.forEach((layer, index) => {
    view.whenLayerView(layer)
        .then((layerView) => {
            if (layer.type === "feature") {
                featureLayerView = layerView;
            }
        })
        .catch(console.error);
    });
    view.on("immediate-click", (event) => {
        if (state == 3 && popup == false){
            view.hitTest(event)
            .then((hitTestResult) => {
                let hits = hitTestResult.results
                if (hits.length == 0){
                    highlightedParcel = null
                }
                for (let i=0; i<hits.length; i++){
                    if (hits[i].layer == parcelLayer){
                        selectedKey = hits[i].graphic.key

                        if (markingParcels && parcelViewingMode == "offset"){
                            multiParcelSel(selectedKey)
                        } else {

                            if (highlightedParcel){
                                highlightedParcel.symbol = parcelFillSymbol
                            }

                            highlightedParcel = hits[i].graphic
                            hits[i].graphic.symbol = parcelHighlightSymbol

                            if (parcelViewingMode == "offset"){
                                document.getElementById("text1").innerHTML = "Parcel key: " + selectedKey
                                document.getElementById("text3").innerHTML = "Parcel area: " + dataCol[selectedKey]["area"] + " sqm"
                                document.getElementById("text4").innerHTML = "Orientation: " + dataCol[selectedKey]["orientation"]
                                document.getElementById("text5").innerHTML = "Elongation: " + dataCol[selectedKey]["elongation"]
                                document.getElementById("text6").innerHTML = "Compactness: " + dataCol[selectedKey]["compactness"]
                                document.getElementById("text7").innerHTML = "Convexity: " + dataCol[selectedKey]["convexity"]
                            } else if (parcelViewingMode == "tree"){
                                document.getElementById("text1").innerHTML = "Parcel key: " + selectedKey
                                document.getElementById("text2").innerHTML = "Parcel depth: " + dataTree[selectedKey]["depth"]
                                document.getElementById("text3").innerHTML = "Parcel area: " + dataTree[selectedKey]["area"] + " sqm"
                                document.getElementById("text4").innerHTML = "Orientation: " + dataTree[selectedKey]["orientation"]
                                document.getElementById("text5").innerHTML = "Elongation: " + dataTree[selectedKey]["elongation"]
                                document.getElementById("text6").innerHTML = "Compactness: " + dataTree[selectedKey]["compactness"]
                                document.getElementById("text7").innerHTML = "Convexity: " + dataTree[selectedKey]["convexity"]
                            }
                        }
                    }
                }
            })
            .catch((error) => {
                console.log(error)
            })
        } else {
            highlightedParcel = null
        }
    })
    view.watch('zoom', zoomChanged);
}

function setupWidgets(Measurement){
    // Create new instance of the Measurement widget
    measurement = new Measurement();

    // configure measurement buttons
    let activeView = view
    measurement.view = activeView;
    document.getElementById("distance").onclick = measureDistance;
    document.getElementById("area").onclick = measureArea;
    document.getElementById("clearMe").onclick = clearMeasure;
}

function setupSketch(SketchViewModel, FeatureFilter, Graphic, geometryEngine){
    // use SketchViewModel to draw polygons that are used as a filter
    sketchGeometry = null;
    sketchViewModel = new SketchViewModel({
        layer: sketchLayer,
        view: view,
        pointSymbol: {
            type: "simple-marker",
            style: "circle",
            size: 10,
            color: [211, 132, 80, 0.9],
            outline: {
            color: [211, 132, 80, 0.7],
            size: 10
            }
        },
        polygonSymbol: {
            type: "polygon-3d",
            symbolLayers: [
            {
                type: "fill",
                material: {
                color: [255, 255, 255, 0.8]
                },
                outline: {
                color: [211, 132, 80, 0.7],
                size: "2px"
                }
            }
            ]
        },
        defaultCreateOptions: { hasZ: false }
    });

    sketchViewModel.on(["create"], (event, geom) => {
        // update the filter every time the user finishes drawing the filtergeometry
        if (event.state == "complete") {
            sketchGeometry = event.graphic.geometry;
            if (sketchGeometry.type == "polygon" && state == 0){
                updateFilter(FeatureFilter, Graphic, geometryEngine);
                currentPolygon = sketchGeometry
                currentPolygonGraphic = event.graphic
            } else {
                currentPolygon = undefined
            }
            if (sketchGeometry.type == "point" && state == 1){
                if (pointOne == undefined){
                    pointOne = sketchGeometry
                    pointOneGraphic = event.graphic
                } else if (pointTwo == undefined){
                    pointTwo = sketchGeometry
                    pointTwoGraphic = event.graphic
                }
            }
        }
    });
  
    sketchViewModel.on(["update"], (event) => {
        eventInfo = event.toolEventInfo;
        // update the filter every time the user moves the filtergeometry
        if (event.toolEventInfo && event.toolEventInfo.type.includes("stop")) {
            sketchGeometry = event.graphics[0].geometry;
            updateFilter(FeatureFilter, Graphic, geometryEngine);
        }
    });
  
    // configure sketch buttons
    document.getElementById("point-geometry-button").onclick = geometryButtonsClickHandler;
    document.getElementById("polygon-geometry-button").onclick = geometryButtonsClickHandler;
}