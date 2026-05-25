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
        
        # Clean keys and values and format as nested dict
        clean_mapping = {}
        for row in mapping:
            # Look for the subject key which could be 'Subject' or similar
            subject_key = next((k for k in row.keys() if str(k).strip().lower() == 'subject'), None)
            
            if subject_key and pd.notna(row[subject_key]):
                subject_name = str(row[subject_key]).strip()
                if subject_name:
                    clean_mapping[subject_name] = {}
                    
                    for k, v in row.items():
                        k_str = str(k).strip()
                        if k_str != subject_key and pd.notna(k) and pd.notna(v):
                            val = str(v).strip()
                            if val:
                                clean_mapping[subject_name][k_str] = val
                
        output_path = os.path.join('timetable-web-app', 'src', 'data', 'teacher_mapping.json')
        with open(output_path, 'w') as f:
            json.dump(clean_mapping, f, indent=2)
            
        print(f"Teacher mapping saved to {output_path}")
    else:
        print("Teacher_List not found. Please check the Excel sheet.")

if __name__ == '__main__':
    extract_teacher_mapping()
