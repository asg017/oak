from os import listdir, path, remove
import sys
import pandas as pd
import sqlite3

curr_year_raw = sys.argv[1]
output_db = sys.argv[2]

if path.exists(output_db):
    remove(output_db)

conn = sqlite3.connect(output_db)

c = conn.cursor()
c.execute(
    'CREATE TABLE records (source text, station text, date text, type text, value real)')
conn.commit()


print(f"Uploading {curr_year_raw} to database")

df_chunk = pd.read_csv(curr_year_raw, compression="gzip",
                       chunksize=2000000, header=None)
for df in df_chunk:
    print(f"\tchunk...")
    df = df.drop(columns=[4, 5, 6, 7])
    df = df.rename(index=str, columns={
        0: "station", 1: "date", 2: "type", 3: "value"})
    df['source'] = curr_year_raw
    df.to_sql('records', con=conn, if_exists='append', index=False)

conn.close()

print("All files processed.")
