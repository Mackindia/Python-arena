import pandas as pd
import json
import os

def extract_smart_pandas():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, 'final updated 11a and b timetable sheet doon scholars.xlsx')
    
    print("Reading Excel file using Pandas for accurate mapping...")
    try:
        xl = pd.ExcelFile(file_path)
    except Exception as e:
        print("Error reading excel file:", e)
        return
        
    tt_sheets = [s for s in xl.sheet_names if s.startswith('TT_')]
    timetables = {}
    
    # 1. First, try to build a Subject-Teacher Map from any mapping sheet
    subject_teacher_map = {}
    map_sheet_found = False
    
    for s in xl.sheet_names:
        if s.startswith('TT_') or s == 'Teacher_List':
            continue
            
        df_temp = xl.parse(s, header=None)
        header_idx = -1
        class_col_idx = -1
        sub_col_idx = -1
        teach_col_idx = -1
        
        # Find the header row
        for idx, row in df_temp.iterrows():
            row_strs = [str(x).lower().strip() for x in row if pd.notna(x)]
            row_full = " ".join(row_strs)
            if 'class' in row_full and 'sub' in row_full and 'teach' in row_full:
                header_idx = idx
                for c_idx, val in enumerate(row):
                    if pd.notna(val):
                        v_str = str(val).lower().strip()
                        if 'class' in v_str: class_col_idx = c_idx
                        elif 'sub' in v_str: sub_col_idx = c_idx
                        elif 'teach' in v_str: teach_col_idx = c_idx
                break
                
        if header_idx != -1 and class_col_idx != -1 and sub_col_idx != -1 and teach_col_idx != -1:
            print(f"Found Subject-Teacher Map in sheet: {s}")
            map_sheet_found = True
            for idx in range(header_idx + 1, len(df_temp)):
                row = df_temp.iloc[idx]
                c_val = str(row.iloc[class_col_idx]).strip().lower().replace(' ', '')
                s_val = str(row.iloc[sub_col_idx]).strip()
                t_val = str(row.iloc[teach_col_idx]).strip()
                
                if c_val and c_val != 'nan' and s_val and s_val != 'nan' and t_val and t_val != 'nan':
                    if c_val not in subject_teacher_map:
                        subject_teacher_map[c_val] = {}
                    subject_teacher_map[c_val][s_val.lower()] = t_val
            break

    if not map_sheet_found:
        print("Warning: Could not automatically detect a Subject-Teacher Map sheet.")

    def find_teacher_for_subject(class_id, subject):
        if not subject or subject.lower() in ['nan', 'none', '0', '']:
            return ""
        if class_id in subject_teacher_map:
            sub_lower = subject.lower().strip()
            # Exact match
            if sub_lower in subject_teacher_map[class_id]:
                return subject_teacher_map[class_id][sub_lower]
            # Partial match
            for mapped_sub, mapped_teacher in subject_teacher_map[class_id].items():
                if sub_lower in mapped_sub or mapped_sub in sub_lower:
                    return mapped_teacher
                    
        # Try generic match across all classes if specific class not found
        for cid, sub_map in subject_teacher_map.items():
            sub_lower = subject.lower().strip()
            if sub_lower in sub_map:
                return sub_map[sub_lower]
            for mapped_sub, mapped_teacher in sub_map.items():
                if sub_lower in mapped_sub or mapped_sub in sub_lower:
                    return mapped_teacher
        return ""

    for sheet_name in tt_sheets:
        class_id = sheet_name.replace('TT_', '').lower()
        df = xl.parse(sheet_name)
        
        # Search for 'Mon' or 'Monday' to find the grids
        mon_rows = []
        for idx, row in df.iterrows():
            row_str = " ".join([str(val).strip().lower() for val in row if pd.notna(val)])
            if 'mon' in row_str.split() or 'monday' in row_str.split():
                mon_rows.append(idx)
                
        if len(mon_rows) == 0:
            print(f"Warning: Could not find any 'Mon' rows in {sheet_name}. Defaulting to 0 and 10.")
            subject_start = 0
            teacher_start = 10
        elif len(mon_rows) == 1:
            print(f"Warning: Only one 'Mon' row found in {sheet_name}. Using Subject-Teacher Map for missing teachers.")
            subject_start = mon_rows[0]
            teacher_start = None # Indicate we need to rely purely on map
        else:
            subject_start = mon_rows[0]
            teacher_start = mon_rows[1]
            
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        schedule = []
        
        for i, day in enumerate(days):
            subj_row_idx = subject_start + i
            teach_row_idx = (teacher_start + i) if teacher_start is not None else None
            
            if subj_row_idx < len(df):
                subj_row = df.iloc[subj_row_idx]
            else:
                subj_row = pd.Series([None]*20)
                
            if teach_row_idx is not None and teach_row_idx < len(df):
                teach_row = df.iloc[teach_row_idx]
            else:
                teach_row = pd.Series([None]*20)
                
            for col_idx in range(1, 9):
                if col_idx < len(subj_row):
                    subject = str(subj_row.iloc[col_idx]).strip() if pd.notna(subj_row.iloc[col_idx]) else ''
                    
                    if teach_row_idx is not None and col_idx < len(teach_row):
                        teacher = str(teach_row.iloc[col_idx]).strip() if pd.notna(teach_row.iloc[col_idx]) else ''
                    else:
                        teacher = ""
                        
                    # If teacher is missing or invalid, fallback to the Subject-Teacher Map
                    if subject and subject.lower() not in ['nan', 'none', '0']:
                        if not teacher or teacher.lower() in ['nan', 'none', '0', '']:
                            teacher = find_teacher_for_subject(class_id, subject)
                            
                        schedule.append({
                            'day': day,
                            'period': col_idx,
                            'subject': subject,
                            'teacher': teacher if teacher.lower() not in ['nan', 'none', '0'] else ''
                        })
                        
        timetables[class_id] = schedule

    print("Computing accurate teacher slot usage...")
    teacher_slot_usage = {}
    
    teachers = []
    clean_mapping = []
    if 'Teacher_List' in xl.sheet_names:
        df_teachers = xl.parse('Teacher_List')
        df_teachers = df_teachers.dropna(how='all')
        
        mapping = df_teachers.to_dict(orient='records')
        
        for row in mapping:
            clean_row = {}
            for k, v in row.items():
                if pd.notna(k):
                    val = v if pd.notna(v) else ""
                    clean_row[str(k).strip()] = str(val).strip()
            
            if any(clean_row.values()):
                clean_mapping.append(clean_row)
                
        for item in clean_mapping:
            for val in item.values():
                if val and str(val).lower() not in ['nan', 'none', '0']:
                    teachers.append(val)
        
        teachers = list(set(teachers))
    
    if not teachers:
        for class_id, schedule in timetables.items():
            for slot in schedule:
                if slot['teacher']:
                    for t in slot['teacher'].split(','):
                        if t.strip() and str(t).lower() not in ['nan', 'none', '0']:
                            teachers.append(t.strip())
        teachers = list(set(teachers))

    for teacher in teachers:
        teacher_slot_usage[teacher] = {}
        for day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']:
            teacher_slot_usage[teacher][day] = {}
            for period in range(1, 9):
                teacher_slot_usage[teacher][day][str(period)] = 0
                
    for class_id, schedule in timetables.items():
        for slot in schedule:
            if slot['teacher'] and str(slot['teacher']).lower() not in ['nan', 'none', '0']:
                assigned_teachers = [t.strip() for t in slot['teacher'].split(',')]
                for t in assigned_teachers:
                    if t in teacher_slot_usage:
                        day = slot['day']
                        period = str(slot['period'])
                        if day in teacher_slot_usage[t] and period in teacher_slot_usage[t][day]:
                            teacher_slot_usage[t][day][period] += 1

    output_dir = os.path.join(script_dir, 'timetable-web-app', 'src', 'data')
    os.makedirs(output_dir, exist_ok=True)
    
    with open(os.path.join(output_dir, 'timetables.json'), 'w') as f:
        json.dump(timetables, f, indent=2)
        
    with open(os.path.join(output_dir, 'teacher_slot_usage.json'), 'w') as f:
        json.dump(teacher_slot_usage, f, indent=2)
        
    if clean_mapping:
        with open(os.path.join(output_dir, 'teacher_mapping.json'), 'w') as f:
            json.dump(clean_mapping, f, indent=2)

    print(f"Extraction complete! Pandas safely mapped missing teachers using the map sheet.")

if __name__ == '__main__':
    extract_smart_pandas()
