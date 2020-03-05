
import sys
import pandas as pd

INPUT = sys.argv[1]
# OUTPUT = sys.argv[2]

raw_df = pd.read_csv(INPUT)

print(raw_df)