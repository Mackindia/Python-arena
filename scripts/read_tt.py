import pandas as pd
import sys
import os

path = os.path.join("C:\\", "Users", "Doon Scholars", "Downloads", "TT (1).xlsx")
try:
    df = pd.read_excel(path)
    print(df.head(20).to_json(orient="records"))
except Exception as e:
    print(str(e))
