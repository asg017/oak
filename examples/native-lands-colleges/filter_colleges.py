import pdb
import argparse
from os import path
import pandas as pd
import numpy as np

parser = argparse.ArgumentParser(description='Process CLI arguments..')
parser.add_argument('-i', '--input')
parser.add_argument('-o', '--output')
args = parser.parse_args()

dir_path = path.dirname(path.realpath(__file__))
INPUT_FILE = path.join(dir_path, args.input)
OUTPUT_FILE = path.join(dir_path, args.output)

df = pd.read_csv(INPUT_FILE)
pdb.set_trace()

# only public/private non profits
schools = df[(df['CONTROL'] == 1) | (df['CONTROL'] == 2)]
schools = schools[schools['MAIN'] == 1]  # only main campuses
# only look at predominately bachelors serving institutions
schools = schools[schools['PREDDEG'] == 3]
schools = schools[schools['DISTANCEONLY'] == 0]  # Only in-person colleges
#  schools = schools[schools['CURROPER'] == 1]  # Only currently operating


# Dropping NaN values for certain columns
schools = schools[(~np.isnan(schools['LATITUDE']))]
schools = schools[(~np.isnan(schools['LONGITUDE']))]


# Personal Preference
schools = schools[schools['UGDS'] > 1800]  # reduce # of schools

cols = [
    'UNITID',  # id
    'INSTNM',  # name
    'CITY',   # city
    'STABBR',  # state
    'ZIP',    # zip
    'INSTURL',  # website
    'UGDS',   # size
    'LATITUDE',
    'LONGITUDE',
    'ADM_RATE',  # admit rate
    'HIGHDEG',  # highest degree offered
    'CONTROL',  # public/private
    'CCBASIC',  # Carnegie Classification -- basic
    'CCUGPROF',  # Carnegie Classification -- undergraduate profile
    'CCSIZSET',  # Carnegie Classification -- size and setting
    'TRIBAL',  # Flag for tribal college and university
    'NANTI',  # Flag for Native American non-tribal institution
    'UGDS_AIAN',  # Total share of enrollment of undergraduate degree-seeking students who are American Indian/Alaska Native
    'UG_AIANOLD',  # Total share of enrollment of undergraduate students who are Asian/Pacific Islander
]

schools = schools[cols]
schools = schools.sort_values(['UGDS'])
schools.to_csv(OUTPUT_FILE)
