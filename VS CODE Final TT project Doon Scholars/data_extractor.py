import pandas as pd
import json
import os
import re

def extract_data(file_path):
    print("Reading Excel file...")
    xl = pd.ExcelFile(file_path)
    
    # 1. Extract load_master
    print("Extracting load_master...")
    df_load = xl.parse('load_master')
    # Filter valid rows and required columns
    df_load = df_load[['Subject', 'Class', 'Section', 'Total_Load', 'Used_Load', 'Remaining_Load']].dropna(subset=['Subject', 'Class'])
    
    # Clean up Class to string
    df_load['Class'] = df_load['Class'].apply(lambda x: str(int(x)) if isinstance(x, float) and x.is_integer() else str(x))
    
    load_master_data = []
    for _, row in df_load.iterrows():
        load_master_data.append({
            'subject': str(row['Subject']).strip(),
            'class_val': str(row['Class']).strip(),
            'section': str(row['Section']).strip() if pd.notna(row['Section']) else '',
            'total_load': float(row['Total_Load']) if pd.notna(row['Total_Load']) else 0,
            'used_load': float(row['Used_Load']) if pd.notna(row['Used_Load']) else 0,
            'remaining_load': float(row['Remaining_Load']) if pd.notna(row['Remaining_Load']) else 0,
            'class_id': f"{str(row['Class']).strip()}{str(row['Section']).strip() if pd.notna(row['Section']) else ''}".lower()
        })
        
    # 2. Extract Timetables (TT_1a to TT_11b)
    print("Extracting Timetables...")
    tt_sheets = [s for s in xl.sheet_names if s.startswith('TT_')]
    timetables = {}
    
    for sheet_name in tt_sheets:
        class_id = sheet_name.replace('TT_', '').lower()
        df_tt = xl.parse(sheet_name)
        
        # In TT sheets: Rows 0-5 are Mon-Sat (Subjects)
        # We also need Teachers. Usually they might be in rows below (e.g. 10-15) as seen in previous inspect.
        # Let's extract the subject grid and teacher grid.
        # Subject Grid: rows 0 to 5, columns P1 to P8
        
        # Find row indices for days
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        schedule = []
        
        try:
            # Subjects are usually first 6 rows, starting row 0
            for row_idx in range(6):
                day = days[row_idx] if row_idx < len(days) else ''
                row_data = df_tt.iloc[row_idx]
                
                # Teacher grid is 10 rows below subject grid in the sample (starting row 10)
                teacher_row_data = df_tt.iloc[row_idx + 10] if (row_idx + 10) < len(df_tt) else None
                
                for col_idx in range(1, 9): # P1 to P8 are typically cols 1 to 8
                    col_name = f'P{col_idx}'
                    subject = str(row_data.iloc[col_idx]) if col_idx < len(row_data) and pd.notna(row_data.iloc[col_idx]) else ''
                    teacher = str(teacher_row_data.iloc[col_idx]) if teacher_row_data is not None and col_idx < len(teacher_row_data) and pd.notna(teacher_row_data.iloc[col_idx]) else ''
                    
                    if subject and subject != 'nan':
                        schedule.append({
                            'day': day,
                            'period': col_idx,
                            'subject': subject,
                            'teacher': teacher if teacher != 'nan' else ''
                        })
                        
            timetables[class_id] = schedule
        except Exception as e:
            print(f"Error parsing {sheet_name}: {e}")
            
    # Extract Teachers list (From Teacher_List or just unique from load_master / maps)
    # Let's try 'Teacher_List'
    teachers = []
    if 'Teacher_List' in xl.sheet_names:
        df_teachers = xl.parse('Teacher_List')
        # assuming first column has names
        if len(df_teachers.columns) > 0:
             teachers = [str(x) for x in df_teachers.iloc[:, 0].dropna().unique() if str(x).strip() and x != 'Teacher Name']
    
    if not teachers:
         # fallback: extract from Subject_Teacher_Map if exists
         pass
    
    # Compute Teacher Slot Usage from timetables
    print("Computing teacher slot usage...")
    teacher_slot_usage = {}
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    # Initialize usage matrix for all teachers
    for teacher in teachers:
        teacher_slot_usage[teacher] = {}
        for day in days:
            teacher_slot_usage[teacher][day] = {}
            for period in range(1, 9):
                teacher_slot_usage[teacher][day][str(period)] = 0
    
    # Count assignments from timetables
    for class_id, schedule in timetables.items():
        for slot in schedule:
            if slot['teacher'] and slot['teacher'].strip() and slot['teacher'] in teacher_slot_usage:
                day = slot['day']
                period = str(slot['period'])
                if day in teacher_slot_usage[slot['teacher']] and period in teacher_slot_usage[slot['teacher']][day]:
                    teacher_slot_usage[slot['teacher']][day][period] += 1
    
    output_dir = 'extracted_data'
    os.makedirs(output_dir, exist_ok=True)
    
    with open(os.path.join(output_dir, 'load_master.json'), 'w') as f:
        json.dump(load_master_data, f, indent=2)
        
    with open(os.path.join(output_dir, 'timetables.json'), 'w') as f:
        json.dump(timetables, f, indent=2)
        
    with open(os.path.join(output_dir, 'teachers.json'), 'w') as f:
        json.dump(teachers, f, indent=2)
        
    with open(os.path.join(output_dir, 'teacher_slot_usage.json'), 'w') as f:
        json.dump(teacher_slot_usage, f, indent=2)

    print(f"Extraction complete! Data saved to {output_dir}/")

if __name__ == '__main__':
    extract_data('final updated 11a and b timetable sheet doon scholars.xlsx')
