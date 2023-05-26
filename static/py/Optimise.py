try:
    # IMPORT DEFAULT LIBRARIES
    import json
    from datetime import datetime
    import psutil
    import ast
    import sys
    import pickle
    import pandas as pd
    import numpy as np
    import geopandas as gpd
    pd.options.mode.chained_assignment = None  # default='warn'
    import time
    import math

    from pymoo.core.problem import ElementwiseProblem
    from pymoo.algorithms.moo.nsga2 import NSGA2
    from pymoo.operators.crossover.sbx import SBX
    from pymoo.operators.mutation.pm import PM
    from pymoo.operators.sampling.rnd import FloatRandomSampling
    from pymoo.core.population import Population
    from pymoo.core.individual import Individual
    from pymoo.termination import get_termination
    from pymoo.optimize import minimize
    from pymoo.util.ref_dirs import get_reference_directions

    # IMPORT COMPUTE AND SETUP FOR CLOUD USE
    import compute_rhino3d.Util
    import compute_rhino3d.Grasshopper as gh

    # IMPORT CUSTOM SCRIPTS
    from Utility import *

    ComputeURL="http://54.255.237.109:80/"
    ComputeKey="0hOfevzxs49OfbXDqyUx"
    Authtoken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwIjoiUEtDUyM3IiwiYyI6IkFFU18yNTZfQ0JDIiwiYjY0aXYiOiJnUFNyTTc5N1ZlOEYyYUxPYW5qazRRPT0iLCJiNjRjdCI6InczNW1sQ011NTB3dU80Sy9vY2Z4ZzBGcHRkRzVPbVpZc3V0Q0FtZ1RYZDg1bEZwOXJWVXg3eFhUcjlwL2JCMkVaTWVGczl2UDNYM21NN1llQ3ZOVE1CdmNOMFZ2c0VBTE5UQVc5ODR1alM2QUhuZ3BKWjlhK0VYT2RDbEJJbmJOM0czMm5ab0Y0S3BhK0F4RWhJakM4UTBPSTlWNEJHdlloY3MrNHZnNExKUXBKa0JCYUc2RTVSYlYxcHZKUWRXQWtIUzhDbElCck5RN1BpZXJ6K1l1TFE9PSIsImlhdCI6MTYzMjMwMTUyOX0.nSvFFz6GPk_pcBx7pBFh---o-upDD1md34RWP9AZNOI"
    UseCloudCompute=True
    
except:
    print('Error importing libraries')

try:
    siteGenerationOutput = json.loads(sys.argv[1])
    #siteGenerationOutput = json.load(open('.\\Static\\data\\sample_SiteGeneration_output.json'))
    OptimisationParameters = siteGenerationOutput[list(siteGenerationOutput.keys())[0]]['OptimisationParameters']
    ParameterRanges = siteGenerationOutput[list(siteGenerationOutput.keys())[0]]['ParameterRanges']
    XKeys = list(['BKeyXScale', 'BKeyYScale', 'GridAngle', 'GridSpacing', 'ParcelStoreyScale'])
    XTypes = ["System.Double","System.Double","System.Double","System.Double","System.Double"]
    FKeys = ['TotalViewObstruction','MeanEWAspectRatio']

except Exception as e:
    print('Error loading inputs during pre-optimisation:',e)

try:
    # store important information not saved in opt algo
    archiveResults = {}

    class Problem(ElementwiseProblem):
        def __init__(self):
            super().__init__(
                n_var=len(XKeys),
                n_obj=len(FKeys),
                n_constr=1,
                xl=np.array([[float(min),float(max)] for min,max in [ParameterRanges[xkey] for xkey in XKeys]]).transpose()[0],
                xu=np.array([[float(min),float(max)] for min,max in [ParameterRanges[xkey] for xkey in XKeys]]).transpose()[1]
                )

        def _evaluate(self, X, out, *args, **kwargs):
            # Unique archive key by rounding parameters to 8 digits
            archiveKey = GetArchiveKey(X)

            if archiveKey not in archiveResults:

                # Run Module B
                GHFilename = "static/gh/BuildingGeneration.ghx"
                GHInputVariables = [json.dumps(siteGenerationOutput)] + list(X)
                GHInputKeys = ['SiteGenerationJson'] + XKeys
                GHInputTypes = ["System.String"] + XTypes
                raw_output = EvaluateGrasshopper(GHFilename,GHInputVariables,GHInputKeys,GHInputTypes,UseCloudCompute,ComputeURL,ComputeKey,Authtoken)
                buildingGenerationOutput = json.loads(json.loads(raw_output['values'][0]['InnerTree']['{0}'][0]['data']))

                # Run Module C
                GHFilename = "static/gh/CombinedEvaluation.ghx"
                GHInputVariables = [json.dumps(siteGenerationOutput), json.dumps(buildingGenerationOutput)]
                GHInputKeys = ['SiteGenerationJson', 'BuildingGenerationJson']
                GHInputTypes = ["System.String","System.String"]
                raw_output = EvaluateGrasshopper(GHFilename,GHInputVariables,GHInputKeys,GHInputTypes,UseCloudCompute,ComputeURL,ComputeKey,Authtoken)
                combinedEvaluationOutput = json.loads(json.loads(raw_output['values'][0]['InnerTree']['{0}'][0]['data']))

                # Save Unique Results 
                archiveResults[archiveKey] = {'buildingGenerationOutput':buildingGenerationOutput, 'combinedEvaluationOutput':combinedEvaluationOutput}
            
            else:
                # use results for archive, dont run GH
                combinedEvaluationOutput = archiveResults[archiveKey]['combinedEvaluationOutput']
            
            F = [combinedEvaluationOutput['Objectives'][fkey]['score'] for fkey in FKeys]
            G = [combinedEvaluationOutput['ConstraintViolation']]   
            out["F"] = F
            out["G"] = G
            
    MyProblem = Problem()

    MyAlgorithm = NSGA2(
        pop_size=int(OptimisationParameters['PopulationCount']),
        eliminate_duplicates=False,
        sampling = FloatRandomSampling(),
        crossover=SBX(prob=float(OptimisationParameters['CrossOverRate']), eta=15),
        mutation=PM(prob=float(OptimisationParameters['MutationRate']), eta=20),
    )

    MyTermination = get_termination("n_gen", int(OptimisationParameters['GenerationCount']))
except Exception as e:
    print('Error creating optimisation objects:',e)

try:
    MyAlgorithm.setup(MyProblem, termination=MyTermination, seed=random.randint(0, 2**10),save_history=True, verbose=False)
    
    while MyAlgorithm.has_next():
        # run algorithm
        MyAlgorithm.next()
        # read pymoo results into a df
        df = ReadResults(MyAlgorithm.result())
        df.columns = ['Gen','Pop'] + XKeys + FKeys + ['CV']
        # fetch archived items as a json string to add into df
        for i,row in df.iterrows():
            archiveKey = GetArchiveKey(row[XKeys].to_list())
            df.loc[i,'Archive'] = json.dumps(archiveResults[archiveKey])
            print(df.to_json())
        
        # flush to output result individually
        sys.stdout.flush()

except Exception as e:
    print('Error during optimisation:',e)
