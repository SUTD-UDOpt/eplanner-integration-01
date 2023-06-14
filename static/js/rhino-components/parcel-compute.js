async function compute(RhinoCompute, displaySlot, roadCat) {
    let weightArr = [0,0,0]
    for (let i=0; i<5; i++){
        weightArr.push(document.getElementById("w" + i).value)
    }

    var pRoad = document.getElementById("pRoad").value / 100
    var sRoad = document.getElementById("sRoad").value / 100
    let roadPercentage = [pRoad, sRoad, (1 - pRoad - sRoad)]

    const param1 = new RhinoCompute.Grasshopper.DataTree('Coords')
    param1.append([0], [savedPolygon.rings.toString()])
    const param2 = new RhinoCompute.Grasshopper.DataTree('PointAX')
    param2.append([0], [pointOne.x])
    const param3 = new RhinoCompute.Grasshopper.DataTree('PointAY')
    param3.append([0], [pointOne.y])
    const param4 = new RhinoCompute.Grasshopper.DataTree('PointBX')
    param4.append([0], [pointTwo.x])
    const param5 = new RhinoCompute.Grasshopper.DataTree('PointBY')
    param5.append([0], [pointTwo.y])
    const param6 = new RhinoCompute.Grasshopper.DataTree('MinArea')
    param6.append([0], [document.getElementById("minArea").value])
    const param7 = new RhinoCompute.Grasshopper.DataTree('Orientation')
    param7.append([0], [document.getElementById("orientation").value])
    const param8 = new RhinoCompute.Grasshopper.DataTree('Roads')
    param8.append([0], roadPercentage)
    const param9 = new RhinoCompute.Grasshopper.DataTree('EdgeCat')
    param9.append([0], [roadCat])

    const trees = []
    trees.push(param1)
    trees.push(param2)
    trees.push(param3)
    trees.push(param4)
    trees.push(param5)
    trees.push(param6)
    trees.push(param7)
    trees.push(param8)
    trees.push(param9)
    console.log(trees)

    try {
        const res = await RhinoCompute.Grasshopper.evaluateDefinition(definition, trees)
        console.log(res)
        saveData[0] = {'empty': false,
                    'arcgis': {'polygon': savedPolygonGraphic,
                                'pointone': pointOneGraphic,
                                'pointtwo': pointTwoGraphic},
                    'raw': res,
                    'base': undefined,
                    'datacol': undefined,
                    'datatree': undefined,
                    'depthtree': undefined,
                    'buildingdata': undefined
                    }
        savePolygon[0] = savedPolygon
        displaySlot(0)

        document.getElementById("actionButton").disabled = false;
    }
    catch(error){
        alert("Sorry parcel generation was not successful, please revise your inputs.")
        document.getElementById("actionButton").disabled = false;
        document.getElementById('loader').style.display = 'none'
        console.log(error)
        console.error(`Not possible to parcellate...`);
    }
}

function useRoadData(RhinoCompute, displaySlot){
    let mockRoadInput = []
    let vertices = savedPolygon.rings.toString().split(",")
    for (let i=0; i<vertices.length - 1; i++){
      mockRoadInput.push(3)
    }
  
    compute(RhinoCompute, displaySlot, mockRoadInput.toString())
}