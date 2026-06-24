import pandas as pd
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, 'final updated 11a and b timetable sheet doon scholars.xlsx')

xl = pd.ExcelFile(file_path)
print("Sheet Names:", xl.sheet_names)

# Check load_master
if 'load_master' in xl.sheet_names:
    df = xl.parse('load_master')
    print("load_master columns:", df.columns.tolist())
    print(df.head())

# Also try to find any map sheet
for sheet in xl.sheet_names:
    if 'map' in sheet.lower():
        print(f"\nFound map sheet: {sheet}")
        df = xl.parse(sheet)
        print(df.columns.tolist())
        print(df.head())
