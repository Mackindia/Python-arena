import pandas as pd
import json

def inspect_sheet():
    file_path = 'final updated 11a and b timetable sheet doon scholars.xlsx'
    
    xl = pd.ExcelFile(file_path)
    if 'TT_1a' in xl.sheet_names:
        df = xl.parse('TT_1a')
        # Print the first 25 rows, up to 10 columns
        print(df.iloc[0:25, 0:10].to_string())
        
        # Output this to a text file for easy reading
        with open('inspect_TT_1a.txt', 'w') as f:
            f.write(df.iloc[0:25, 0:10].to_string())
        print("\nSaved structure to inspect_TT_1a.txt")

if __name__ == '__main__':
    inspect_sheet()
