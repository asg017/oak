import pdb
import argparse
from os import path
import geopandas as gpd
from shapely.geometry import Point

parser = argparse.ArgumentParser(description='Process CLI arguments..')
parser.add_argument('-i', '--input')
parser.add_argument('-o', '--output')
args = parser.parse_args()

# https://github.com/datadesk/california-k12-notebooks/blob/master/02_transform.ipynb

print(args.input, args.output)

def df_to_gdf(input_df, crs={'init': u'epsg:4326'}):
    """
    Accepts a DataFrame with longitude and latitude columns. Returns a GeoDataFrame.
    """
    df = input_df.copy()
    geometry = [Point(xy) for xy in zip(df.longitude, df.latitude)]
    return gpd.GeoDataFrame(df, crs=crs, geometry=geometry)


input_df = gpd.pd.read_csv(args.input)
gdf = df_to_gdf(input_df)
gdf.to_file(args.output, driver='GeoJSON')
