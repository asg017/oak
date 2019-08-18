import pdb
import argparse
from os import path
import geopandas as gpd
from shapely.geometry import Point

parser = argparse.ArgumentParser(description='Process CLI arguments..')
parser.add_argument('-i', '--input')
parser.add_argument('-o', '--output')
args = parser.parse_args()

dir_path = path.dirname(path.realpath(__file__))
INPUT_FILE = path.join(dir_path, args.input)
OUTPUT_FILE = path.join(dir_path, args.output)

# https://github.com/datadesk/california-k12-notebooks/blob/master/02_transform.ipynb


def df_to_gdf(input_df, crs={'init': u'epsg:4326'}):
    """
    Accepts a DataFrame with longitude and latitude columns. Returns a GeoDataFrame.
    """
    df = input_df.copy()
    geometry = [Point(xy) for xy in zip(df.longitude, df.latitude)]
    return gpd.GeoDataFrame(df, crs=crs, geometry=geometry)


input_df = gpd.pd.read_csv(INPUT_FILE)
gdf = df_to_gdf(input_df)
gdf.to_file(OUTPUT_FILE, driver='GeoJSON')
