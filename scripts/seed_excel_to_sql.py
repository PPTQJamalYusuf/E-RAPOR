import openpyxl
import json
import os
import re

excel_path = "Absensi Diniyah.xlsx"
output_json = "src/data/initialSantri.json"
output_sql = "supabase/seed.sql"

def to_proper_case(name: str) -> str:
    """Format nama santri menjadi Title Case / Proper Case yang rapi dan konsisten."""
    name = " ".join(name.strip().split())
    words = name.split()
    formatted_words = []
    
    for word in words:
        if '-' in word:
            subparts = word.split('-')
            formatted_subparts = []
            for sp in subparts:
                sp_clean = sp.capitalize()
                if sp_clean.startswith("'") and len(sp_clean) > 1:
                    sp_clean = "'" + sp_clean[1:].capitalize()
                formatted_subparts.append(sp_clean)
            formatted_words.append('-'.join(formatted_subparts))
        elif "'" in word:
            parts = word.split("'")
            formatted_parts = []
            for i, p in enumerate(parts):
                if i == 0:
                    formatted_parts.append(p.capitalize())
                else:
                    formatted_parts.append(p.capitalize() if len(p) > 2 else p.lower())
            formatted_words.append("'".join(formatted_parts))
        else:
            formatted_words.append(word.capitalize())
            
    res = " ".join(formatted_words)
    
    special_fixes = {
        "Al-lathifa": "Al-Lathifa",
        "Az-zahra": "Az-Zahra",
        "Al-muslimah": "Al-Muslimah",
        "Al-hawra": "Al-Hawra",
        "Nis'a": "Nis'A"
    }
    for k, v in special_fixes.items():
        res = re.sub(re.escape(k), v, res, flags=re.IGNORECASE)
        
    return res

wb = openpyxl.load_workbook(excel_path, data_only=True)

class_map = {
    '1 Diniyah ': 'الأول',
    '2 Diniyah': 'الثاني',
    '3 Diniyah': 'الثالث',
    '4 Diniyah': 'الرابع',
    '5 Diniyah': 'الخامس',
    '6 Diniyah': 'السادس'
}

santri_list = []
global_no = 1

for sheet_name, arab_class in class_map.items():
    sheet = wb[sheet_name]
    for r in range(11, 50):
        c1 = sheet.cell(r, 1).value
        c2 = sheet.cell(r, 2).value
        c3 = sheet.cell(r, 3).value
        if str(c1).isdigit() and c3 and str(c3).strip():
            nis = str(c2).strip() if c2 else f"{global_no:05d}"
            nama_raw = " ".join(str(c3).strip().split())
            nama_proper = to_proper_case(nama_raw)
            santri_list.append({
                "id": nis,
                "no": global_no,
                "nis": nis,
                "nama": nama_proper,
                "kelas": arab_class,
                "semester": "الأول",
                "nilaiJuz": {}
            })
            global_no += 1

# 1. Simpan ke src/data/initialSantri.json
os.makedirs("src/data", exist_ok=True)
with open(output_json, "w", encoding="utf-8") as f:
    json.dump(santri_list, f, ensure_ascii=False, indent=2)

print(f"Sukses update {output_json}: {len(santri_list)} santri (semua nama sudah Proper Case).")

# 2. Simpan ke supabase/seed.sql
sql_lines = [
    "-- ==============================================================================",
    f"-- Seed Data E-Rapot Tahfidz dari '{excel_path}' (TP 2026/2027)",
    f"-- Total Santri: {len(santri_list)} (Nama sudah Proper Case)",
    "-- ==============================================================================",
    "",
    "-- 1. Tahun Ajaran Default",
    "INSERT INTO tahun_ajaran (id, nama, semester, is_active)",
    "VALUES ('a0000000-0000-0000-0000-000000000001', '2026/2027', 'الأول', true)",
    "ON CONFLICT DO NOTHING;",
    "",
    "-- 2. Data Santri Master (Berdasarkan NIS dan Kelas Bahasa Arab)",
]

for s in santri_list:
    nama_escaped = s["nama"].replace("'", "''")
    sql_lines.append(
        f"INSERT INTO santri (nis, nama, kelas, jenis_kelamin, status) "
        f"VALUES ('{s['nis']}', '{nama_escaped}', '{s['kelas']}', 'P', 'aktif') "
        f"ON CONFLICT (nis) DO UPDATE SET nama = EXCLUDED.nama, kelas = EXCLUDED.kelas;"
    )

os.makedirs("supabase", exist_ok=True)
with open(output_sql, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines) + "\n")

print(f"Sukses generate {output_sql}: {len(santri_list)} santri.")
