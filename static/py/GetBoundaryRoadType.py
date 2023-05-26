import geopandas as gpd
from shapely.geometry import Point, Polygon, LineString
import matplotlib.pyplot as plt
import numpy as np
from pyproj import Transformer
import math
from numpy import cross, eye, dot
from scipy.linalg import expm, norm
import sys
import json

def rotateVector(point,degree):
    return list(dot(expm(cross(eye(3), [0,0,1]/norm([0,0,1]) * math.radians(degree))),point))[:2]

def GetPerpLines(coordinates,extensionLength):
    geometries = []
    for i in range(1,len(coordinates)):
        cA = coordinates[i-1]
        cB = coordinates[i]
        midPt = np.mean([cA,cB],axis=0)
        tangentVector = list(np.subtract(cB, cA)) + [0]
        perpVector = rotateVector(tangentVector,90)

        newPt = np.sum([midPt,[v*extensionLength for v in perpVector / np.linalg.norm(perpVector)]],axis=0)

        geometries.append(LineString([
            np.sum([midPt,[v*extensionLength for v in perpVector / np.linalg.norm(perpVector)]],axis=0),
            np.sum([midPt,[-1*v*extensionLength for v in perpVector / np.linalg.norm(perpVector)]],axis=0)
            ]))
    return geometries

def GetRoadNetworkWithinCircle(roadNetwork,circle):
    subsetRoadNetwork = roadNetwork.loc[
        (roadNetwork.within(circle)) & 
        (roadNetwork.RD_TYP_CD != 'Slip Road') & 
        (roadNetwork.geometry.geom_type == 'LineString'
        ),:] # clip road network with circle and road type
    return subsetRoadNetwork

def ApproximateBoundaryRoadType(lines, rn_gdf):
    roadTypes = []
    for line in lines:
        intersected = False
        for i,row in rn_gdf.iterrows():
            if line.intersection(row.geometry).geom_type == "Point":
                roadTypes.append(row.RD_TYP_CD)
                intersected = True
                break
        if not intersected:
            roadTypes.append(None)
    return roadTypes

roadNetwork = gpd.read_file('static\data\MP19-road-network.json')
coordinates = json.loads(sys.argv[1])

# expected input format
"""
coordinates = [[11572167.416978128,150521.21406146095],
    [11572278.470959637,150462.96250363553],
    [11572391.991755677,150267.33087687174],
    [11571824.581040159,149797.75239533],
    [11571491.145315617,150182.79447788052],
    [11572035.27870959,150373.06172110923],
    [11572167.416978128,150521.21406146095]]
""" 

polygon = Polygon(coordinates)
radius = math.sqrt(polygon.area/math.pi)*3
circle = polygon.centroid.buffer(radius)
lines = GetPerpLines(coordinates,40)
rn_gdf = GetRoadNetworkWithinCircle(roadNetwork.to_crs("EPSG:3857"),circle)
boundaryRoadTypes = ApproximateBoundaryRoadType(lines, rn_gdf)
boundaryRoadCat = []

for i in range(len(boundaryRoadTypes)):
    if boundaryRoadTypes[i] not in ['Imaginary Line','T-Junction','Slip Road','Cross Junction']:
        if boundaryRoadTypes[i] == "Major Arterials/Minor Arterials":
            boundaryRoadCat.append(3)
        elif boundaryRoadTypes[i] == "Local Collector/Primary Access":
            boundaryRoadCat.append(4)
        elif boundaryRoadTypes[i] == "Local Access":
            boundaryRoadCat.append(5)
        elif boundaryRoadTypes[i] == "Expressway":
            boundaryRoadCat.append(1)
        elif boundaryRoadTypes[i] == None:
            boundaryRoadCat.append(6)
        else:
            boundaryRoadCat.append(2)
    else:
        boundaryRoadCat.append(6)

print(boundaryRoadCat)