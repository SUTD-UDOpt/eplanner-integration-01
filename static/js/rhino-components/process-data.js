function processData(res, num){
  markingParcels = false
  document.getElementById('loader').style.display = 'none'
  setComponentDisplay([1,2,2,2,2])
  clearPolygon()
  resetSceneAndData()

  if (Object.keys(res.values[0].InnerTree).length > 0){
    let numData = res.values[0].InnerTree['{0;0;0;0;0}'].length

    for (let i=0; i<numData; i++){
      var childrenRaw = JSON.parse(res.values[0].InnerTree['{0}'][i].data)
      var parentRaw = JSON.parse(res.values[0].InnerTree['{0;0}'][i].data)
      var depthRaw = JSON.parse(res.values[0].InnerTree['{0;0;0}'][i].data)
      var evaRaw = JSON.parse(res.values[0].InnerTree['{0;0;0;0;0;0}'][i].data).split(",")

      dataTree[i] = {"children":[], 
                    "depth": parseInt(depthRaw),
                    "id": i,
                    "graphic": null,
                    "area": parseFloat(evaRaw[0]),
                    "orientation": parseFloat(evaRaw[1]),
                    "elongation": parseFloat(evaRaw[2]),
                    "compactness": parseFloat(evaRaw[3]),
                    "convexity": parseFloat(evaRaw[4])}

      if (parentRaw != "None"){
        dataTree[i]["parentId"] = [parseInt(parentRaw)]
      }
      if (childrenRaw != "empty"){
        dataTree[i]["children"] = childrenRaw.split(",").map(e => {return parseInt(e)})
      }

      var depthVal = parseInt(depthRaw)
      if (depthTree[depthVal] == undefined){
        depthTree[depthVal] = {"id": depthVal,
                              "member": [i]}
        if (depthVal > 0){
          depthTree[depthVal]["parentId"] = depthVal - 1
        }
      } else {
        depthTree[depthVal]["member"].push(i)
      }
    }
    saveData[num]['datatree'] = dataTree
    saveData[num]['depthtree'] = depthTree
    builddepthtree(depthTree)
    buildtree(dataTree)
  }

  if (Object.keys(res.values[3].InnerTree).length > 0){
    let data = JSON.parse(JSON.parse(res.values[3].InnerTree['{0}'][0].data))
    console.log(data)
    let dataKeys = Object.keys(data)
    for (let i=0; i<dataKeys.length; i++){
      dataCol[i] = {"id": i,
                  "program": "none",
                  "graphic": null,
                  "coords": data[dataKeys[i]]["ParcelCoordinates"],
                  "edgecat": data[dataKeys[i]]["EdgeCategory"],
                  "area": truncate(data[dataKeys[i]]["Area"]),
                  "orientation": truncate(data[dataKeys[i]]["Scores"][0]),
                  "elongation": truncate(data[dataKeys[i]]["Scores"][1]),
                  "compactness": truncate(data[dataKeys[i]]["Scores"][2]),
                  "convexity": truncate(data[dataKeys[i]]["Scores"][3])}
    }

    document.getElementById("macro3").innerHTML = "Average parcel area: " + truncate(JSON.parse(res.values[3].InnerTree['{2}'][0].data)) + " sqm"
    document.getElementById("macro4").innerHTML = "Average orientation: " + truncate(JSON.parse(res.values[3].InnerTree['{2}'][1].data))
    document.getElementById("macro5").innerHTML = "Average elongation: " + truncate(JSON.parse(res.values[3].InnerTree['{2}'][2].data))
    document.getElementById("macro6").innerHTML = "Average compactness: " + truncate(JSON.parse(res.values[3].InnerTree['{2}'][3].data))
    document.getElementById("macro7").innerHTML = "Aveage convexity: " + truncate(JSON.parse(res.values[3].InnerTree['{2}'][4].data))
  }
  saveData[num]['datacol'] = dataCol
}