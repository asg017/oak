import pandas
import json

dtype = {
  'quarter':str,
  'lot': str,
  'space_type': str,
  
  'num_spots': int,
  'time_counts': object,
  '8am_empty_count': int,
  '9am_empty_count': int,
  '11am_empty_count': int,
  '12pm_empty_count': int,
  '1pm_empty_count': int,
  '2pm_empty_count': int,
  '3pm_empty_count': int,
  '4pm_empty_count': int,
  '5pm_empty_count': int,
}

def analyze():
  df = pandas.read_csv('test.csv', dtype=dtype)
  df['time_counts'] = df['time_counts'].apply(lambda x: json.loads(x))
  
  s_df = df[ (df['space_type'] == 'S') & (df['num_spots'] > 0)]
  s_df['max_occupancy'] = s_df['time_counts'].apply(lambda x: min(x))
  
  print(s_df.groupby(['quarter', 'lot']).sum().head())
  return df
  
def main():
  analyze()
  
if __name__ == '__main__':
  main()