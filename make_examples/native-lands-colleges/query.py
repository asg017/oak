import pandas as pd
import numpy as np
import os, json
from shapely.geometry import shape, Point
from tqdm import tqdm

def query():
    print('opening file...')

    curdir = os.path.dirname(__file__)
    df = pd.read_csv(open(os.path.join(curdir, '../input/colleges/MERGED2015_16_PP.csv')))

    print('file opened')
    schools = df[ (df['CONTROL'] == 1) | (df['CONTROL'] == 2) ] # only public/private non profits
    schools = schools[ schools['MAIN'] == 1 ] # only main campuses
    schools = schools[ schools['PREDDEG'] == 3 ] # only look at predominately bachelors serving institutions
    schools = schools[ schools['DISTANCEONLY'] == 0 ] # Only in-person colleges
    schools = schools[ schools['CURROPER'] == 1 ] # Only currently operating


    # Dropping NaN values for certain columns
    schools = schools[ (~np.isnan(schools['LATITUDE'])) ]
    schools = schools[ (~np.isnan(schools['LONGITUDE'])) ]


    #Personal Preference
    schools = schools[ schools['UGDS'] > 1800 ] # reduce # of schools

    cols = [
        'UNITID', # id
        'INSTNM', # name
        'CITY',   # city
        'STABBR', # state
        'ZIP',    # zip
        'INSTURL',# website
        'UGDS',   # size
        'LATITUDE',
        'LONGITUDE',
        'ADM_RATE', # admit rate
        'HIGHDEG', #highest degree offered
        'CONTROL', # public/private
        'CCBASIC', # Carnegie Classification -- basic
        'CCUGPROF', # Carnegie Classification -- undergraduate profile
        'CCSIZSET', # Carnegie Classification -- size and setting
        'TRIBAL', # Flag for tribal college and university
        'NANTI', #Flag for Native American non-tribal institution
        'UGDS_AIAN', # Total share of enrollment of undergraduate degree-seeking students who are American Indian/Alaska Native
        'UG_AIANOLD', #Total share of enrollment of undergraduate students who are Asian/Pacific Islander

    ]

    schools = schools[cols]
    schools = schools.sort_values(['UGDS'])

    curdir = os.path.dirname(__file__)                                          
    gj = json.load(open(os.path.join(curdir, '../input/nativelands/indigenousTerritories.geojson')))
    
    territory_series = pd.Series(index=schools.index)

    territories = gj.get('features')
    territories_polygons = []

    for i, t in enumerate(territories):
        polygon = shape(t.get('geometry'))
        territories_polygons.append({
            'polygon':polygon,
            'properties': t.get('properties'),
            'id':t.get('id'),
            'index':i,
        })
        t['properties']['colleges'] = []


    with tqdm(total=len(schools)) as pbar:
        for i, s in schools.iterrows():
            p = Point(s['LONGITUDE'], s['LATITUDE'])
            territories_match = []

            for t_i, t in enumerate(territories_polygons):
                if t['polygon'].contains(p):
                    territories_match.append({
                        'id':t.get('id'),
                        'name': t.get('properties').get('Name')
                    })
                    gj.get('features')[t_i]['properties']['colleges'].append(s['UNITID'])
            territory_series[s.name] = json.dumps(territories_match)

            pbar.update(1)

    schools['territories'] = territory_series

    #schools.to_csv('schools.csv')
    schools.to_csv('../display/public/schools.csv')
    json.dump(gj, open('../display/public/territories.geojson', 'w+'))

def main():
    query()

if __name__ == '__main__':
    main()


