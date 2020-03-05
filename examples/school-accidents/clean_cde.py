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

# Adaptd from https://github.com/datadesk/california-k12-notebooks/blob/master/02_transform.ipynb
roster_df = pd.read_csv(
    INPUT_FILE,
    dtype={"CDSCode": str},
    delimiter="\t",
    encoding="latin-1"
)

schools_df = roster_df[~(roster_df.School.isnull())]

active_df = schools_df[schools_df['StatusType'] == 'Active']
trimmed_df = active_df[[
    'CDSCode',
    'School',
    'District',
    'StreetAbr',
    'City',
    'County',
    'Zip',
    'Charter',
    'FundingType',
    'Latitude',
    'Longitude',
    'SOCType',
    'EILCode',
    'GSserved',
]]

trimmed_df['low_grade_served'] = trimmed_df.GSserved.str.split('-').str.get(0)

trimmed_df['high_grade_served'] = trimmed_df.GSserved.str.split('-').str.get(1)

cleaned_df = trimmed_df.rename(columns={
    'CDSCode': "cds_code",
    'School': "name",
    'District': "district",
    'StreetAbr': "street",
    'City': "city",
    'County': "county",
    'Zip': "zipcode",
    'Charter': "is_charter",
    'FundingType': "funding_type",
    'Latitude': "latitude",
    'Longitude': "longitude",
    'SOCType': "ownership",
    'EILCode': "instructional_level",
    'GSserved': "grades_served",
})

filtered_df = cleaned_df[cleaned_df['county'] == 'Los Angeles']
filtered_df.to_csv(OUTPUT_FILE, encoding="utf-8", index=False)
