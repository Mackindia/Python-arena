import pandas as pd
import json
import os

def extract_teacher_mapping():
    file_path = 'final updated 11a and b timetable sheet doon scholars.xlsx'
    
    print("Reading Excel file...")
    try:
        xl = pd.ExcelFile(file_path)
    except Exception as e:
        print("Error reading excel file:", e)
        return

    print("Available sheets:", xl.sheet_names)

    if 'Teacher_List' in xl.sheet_names:
        df = xl.parse('Teacher_List')
        
        # Drop completely empty rows
        df = df.dropna(how='all')
        
        mapping = df.to_dict(orient='records')
        
        # Clean keys and values
        clean_mapping = []
        for row in mapping:
            clean_row = {}
            for k, v in row.items():
                if pd.notna(k):
                    val = v if pd.notna(v) else ""
                    clean_row[str(k).strip()] = str(val).strip()
            
            # Only add if there's an actual teacher name/ID
            if any(clean_row.values()):
                clean_mapping.append(clean_row)
                
        output_path = os.path.join('timetable-web-app', 'src', 'data', 'teacher_mapping.json')
        with open(output_path, 'w') as f:
            json.dump(clean_mapping, f, indent=2)
            
        print(f"Teacher mapping saved to {output_path}")
    else:
        print("Teacher_List not found. Please check the Excel sheet.")

if __name__ == '__main__':
    extract_teacher_mapping()
