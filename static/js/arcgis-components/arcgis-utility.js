function zoomChanged(newValue, oldValue, property, object){
    if (newValue < 12){
        view.zoom = 12
    }
}

// Call the appropriate DistanceMeasurement2D or DirectLineMeasurement3D
function measureDistance() {
    const type = activeView.type;
    measurement.activeTool =
        type.toUpperCase() === "2D" ? "distance" : "direct-line";
        document.getElementById("distance").classList.add("active");
        document.getElementById("area").classList.remove("active");
}

// Call the appropriate AreaMeasurement2D or AreaMeasurement3D
    function measureArea() {
    measurement.activeTool = "area";
    document.getElementById("distance").classList.remove("active");
    document.getElementById("area").classList.add("active");
}

// Clears all measurements
    function clearMeasure() {
    document.getElementById("distance").classList.remove("active");
    document.getElementById("area").classList.remove("active");
    measurement.clear();
}

function clearPolygon() {
    let sketches = sketchLayer.graphics.items
    let toRemove
    sketches.forEach(e => {
        if (e.geometry.type == "polygon"){
            toRemove = e
        }
    })
    sketchLayer.remove(toRemove)
}

  function clearPoints() {
    let sketches = sketchLayer.graphics.items
    let toRemove = []
    sketches.forEach(e => {
        if (e.geometry.type == "point"){
            toRemove.push(e)
        }
    })
    toRemove.forEach(e => {
      sketchLayer.remove(e)
    })
}

function clearEverything() {
    sketchGeometry = null;
    filterGeometry = null;
    sketchLayer.removeAll();
    bufferLayer.removeAll();
    if (featureLayerView != null){
        featureLayerView.filter = null;
    }
    currentPolygon = undefined
    currentPolygonGraphic = undefined
    pointOne = undefined
    pointTwo = undefined
    pointOneGraphic = undefined
    pointTwoGraphic = undefined
    emptyScores()
    document.getElementById("point-geometry-button").style.display = "none"
    document.getElementById("polygon-geometry-button").style.display = "block"
    document.getElementById("sliderContainer").style.display = "none"
    resetSceneAndData()
}

function resetResultDiv(){
    //clearScene()
    emptyScores()
    resetCircles()
}

function geometryButtonsClickHandler(event) {
    const geometryType = event.target.value;
    if (state != 1){
      var p1 = pointOne
      var p2 = pointTwo
      var p1g = pointOneGraphic
      var p2g = pointTwoGraphic
      clearEverything();
      pointOne = p1
      pointTwo = p2
      pointOneGraphic = p1g
      pointTwoGraphic = p2g
        if (pointOneGraphic != undefined){
            sketchLayer.add(pointOneGraphic)
            sketchLayer.add(pointTwoGraphic)
        }
    } else {
        if (pointTwo!= undefined){
            clearPoints();
            pointOne = undefined
            pointTwo = undefined
            pointOneGraphic = undefined
            pointTwoGraphic = undefined
        }
    }
    sketchViewModel.create(geometryType);
}

// set the geometry filter on the visible FeatureLayerView (specify which features to select based on sketched geometry)
function updateFilter(FeatureFilter, Graphic, geometryEngine) {
    updateFilterGeometry(Graphic, geometryEngine);
    featureFilter = new FeatureFilter({
      // autocasts to FeatureFilter
      geometry: filterGeometry,
      spatialRelationship: "disjoint"
    });

    featureLayerView.filter = featureFilter;
}

// update the filter geometry depending on bufferSize
function updateFilterGeometry(Graphic, geometryEngine) {
    // add a polygon graphic for the bufferSize
    if (sketchGeometry) {
        if (bufferSize > 0) {
            const bufferGeometry = geometryEngine.geodesicBuffer(
                sketchGeometry,
                bufferSize,
                "meters"
            );
            if (bufferLayer.graphics.length === 0) {
                bufferLayer.add(
                    new Graphic({
                        geometry: bufferGeometry,
                        symbol: sketchViewModel.polygonSymbol
                    })
                );
            } else {
                bufferLayer.graphics.getItemAt(0).geometry = bufferGeometry;
            }
            filterGeometry = bufferGeometry;
        } else {
            bufferLayer.removeAll();
            filterGeometry = sketchGeometry;
        }
    }
}

function updateFilteronLoad(geom, Graphic, geometryEngine, FeatureFilter){
    if (bufferSize > 0) {
        const bufferGeometry = geometryEngine.geodesicBuffer(
            geom,
            bufferSize,
            "meters"
        );
        if (bufferLayer.graphics.length === 0) {
            bufferLayer.add(
                new Graphic({
                    geometry: bufferGeometry,
                    symbol: sketchViewModel.polygonSymbol
                })
            );
        } else {
            bufferLayer.graphics.getItemAt(0).geometry = bufferGeometry;
        }
        filterGeometry = bufferGeometry;
    } else {
        bufferLayer.removeAll();
        filterGeometry = geom;
    }
    const featureFilter = new FeatureFilter({
        // autocasts to FeatureFilter
        geometry: filterGeometry,
        spatialRelationship: "disjoint"
    });

    featureLayerView.filter = featureFilter;
}

function processInArcGIS(Graphic, Polygon, res, num){
     if (Object.keys(res.values[0].InnerTree).length > 0){
        let data = res.values[0].InnerTree['{0;0;0;0;0}']
        let coords = []
        for (let i=0; i<data.length; i++){
            let rawstr = JSON.parse(data[i].data).split(";")
            let subCoords = []
            for (let j=0; j<rawstr.length; j++){
                var pt = rawstr[j].split(",")
                pt = [parseFloat(pt[0]), parseFloat(pt[1]), 0.2]
                subCoords.push(pt)
            }
            coords.push(subCoords)
        }

        coords.forEach((e, index) => {
            let graphic = createPolygon(Graphic, Polygon, e, parcelFillSymbol, index)
            graphic.visible = false
            dataTree[index]["graphic"] = graphic
            treeLayer.add(graphic)
        })
    }

    if (Object.keys(res.values[1].InnerTree).length > 0){
      // NEED TO UPDATE ON MERGE: parcellation.gh should return 1 extra thing: basecoords string
      let basedata = res.values[1].InnerTree['{1}']
      let rawbase = JSON.parse(basedata[0].data).split(";")
      let baseCoords = []
      for (let i=0; i<rawbase.length; i++){
        var pt = rawbase[i].split(",")
        pt = [parseFloat(pt[0]), parseFloat(pt[1]), 0.1]
        baseCoords.push(pt)
      }
      let basegraphic = createPolygon(Graphic, Polygon, baseCoords, baseFillSymbol, null)
      saveData[num]['base'] = basegraphic
      baseLayer.add(basegraphic)

      let data = res.values[1].InnerTree['{0;0;0;0;0}']
      let coords = []
      for (let i=0; i<data.length; i++){
        let rawstr = JSON.parse(data[i].data).split(";")
        let subCoords = []
        for (let j=0; j<rawstr.length; j++){
          var pt = rawstr[j].split(",")
          pt = [parseFloat(pt[0]), parseFloat(pt[1]), 0.2]
          subCoords.push(pt)
        }
        coords.push(subCoords)
      }

      coords.forEach((e, index) => {
        let graphic = createPolygon(Graphic, Polygon, e, parcelFillSymbol, index)
        dataCol[index]["graphic"] = graphic
        parcelLayer.add(graphic)
      })
    }
}

function createPolygon(Graphic, Polygon, ring, symbol, num){
    let parcelPolygon = new Polygon({
        hasZ: true,
        hasM: true,
        rings: ring,
        spatialReference: { wkid: 3857 } // mercator
    })

    let graphic = new Graphic({
        geometry: parcelPolygon,
        symbol: symbol,
        key: num
    })

    return graphic
}