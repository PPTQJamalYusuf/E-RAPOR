-- ==============================================================================
-- Schema E-Rapot Tahfidz & LMS Pondok Pesantren
-- Free Tier Compatible: Supabase (PostgreSQL 15+)
-- Menyesuaikan rumus & struktur template 'MASTER R.TAHFIDZ NEW.xlsx'
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Master Data: Tahun Ajaran & Semester
CREATE TABLE IF NOT EXISTS tahun_ajaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(50) NOT NULL, -- Contoh: '2024/2025'
    semester VARCHAR(20) NOT NULL, -- 'الأول' (Ganjil) atau 'الثاني' (Genap)
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Master Data: Santri
CREATE TABLE IF NOT EXISTS santri (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nis VARCHAR(30) UNIQUE,
    nama VARCHAR(150) NOT NULL,
    kelas VARCHAR(30) NOT NULL, -- 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'
    jenis_kelamin VARCHAR(10) DEFAULT 'P', -- 'L' / 'P' (Default santriwati sesuai data master)
    status VARCHAR(20) DEFAULT 'aktif', -- 'aktif', 'alumni', 'mutasi'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Transaksi: Rapor Tahfidz (Header)
CREATE TABLE IF NOT EXISTS rapor_tahfidz (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    santri_id UUID NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
    tahun_ajaran_id UUID NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
    tanggal_rapor DATE DEFAULT CURRENT_DATE,
    nama_penguji VARCHAR(100) DEFAULT 'يينى رحمواتـى', -- Default dari Excel (Ustadzah Yenny Rahmawati)
    jabatan_penguji VARCHAR(100) DEFAULT 'رئيسة قسم التحفيظ', -- Kepala Bagian Tahfidz
    total_nilai NUMERIC(7,2) DEFAULT 0,
    rata_rata NUMERIC(5,2) DEFAULT 0,
    predikat_akhir VARCHAR(30) DEFAULT '',
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_santri_tahun UNIQUE (santri_id, tahun_ajaran_id)
);

-- 5. Detail Penilaian: Nilai per Juz (1 s/d 30)
CREATE TABLE IF NOT EXISTS nilai_juz (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rapor_id UUID NOT NULL REFERENCES rapor_tahfidz(id) ON DELETE CASCADE,
    juz INT NOT NULL CHECK (juz >= 1 AND juz <= 30),
    nilai NUMERIC(5,2) NOT NULL CHECK (nilai >= 0 AND nilai <= 100),
    predikat VARCHAR(30) NOT NULL, -- ممتاز, جيّد جدا, جيّد, مقبول, راسب
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_rapor_juz UNIQUE (rapor_id, juz)
);

-- 6. Helper Function: Menentukan Predikat Lafaz Arab Sesuai Rumus Excel
-- Rumus Excel: >=95: ممتاز | >=90: جيّد جدا | >=85: جيّد | >=80: مقبول | <80: راسب
CREATE OR REPLACE FUNCTION get_predikat_tahfidz(p_nilai NUMERIC)
RETURNS VARCHAR AS $$
BEGIN
    IF p_nilai >= 95 THEN
        RETURN 'ممتاز';
    ELSIF p_nilai >= 90 THEN
        RETURN 'جيّد جدا';
    ELSIF p_nilai >= 85 THEN
        RETURN 'جيّد';
    ELSIF p_nilai >= 80 THEN
        RETURN 'مقبول';
    ELSE
        RETURN 'راسب';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Trigger Function: Otomatis Hitung Total Nilai, Rata-rata, & Predikat Akhir Rapor
CREATE OR REPLACE FUNCTION recalc_rapor_tahfidz()
RETURNS TRIGGER AS $$
DECLARE
    v_rapor_id UUID;
    v_total NUMERIC(7,2);
    v_count INT;
    v_avg NUMERIC(5,2);
    v_predikat VARCHAR(30);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_rapor_id := OLD.rapor_id;
    ELSE
        -- Otomatis set predikat per juz jika belum diset atau berubah
        NEW.predikat := get_predikat_tahfidz(NEW.nilai);
        v_rapor_id := NEW.rapor_id;
    END IF;

    -- Hitung agregasi juz yang ada nilainya (COUNT dan SUM)
    SELECT COALESCE(SUM(nilai), 0), COUNT(id)
    INTO v_total, v_count
    FROM nilai_juz
    WHERE rapor_id = v_rapor_id;

    IF v_count > 0 THEN
        v_avg := ROUND(v_total / v_count, 2);
        v_predikat := get_predikat_tahfidz(ROUND(v_avg, 0));
    ELSE
        v_avg := 0;
        v_predikat := '';
    END IF;

    UPDATE rapor_tahfidz
    SET total_nilai = v_total,
        rata_rata = v_avg,
        predikat_akhir = v_predikat,
        updated_at = now()
    WHERE id = v_rapor_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalc_rapor_tahfidz ON nilai_juz;
CREATE TRIGGER trg_recalc_rapor_tahfidz
AFTER INSERT OR UPDATE OR DELETE ON nilai_juz
FOR EACH ROW EXECUTE FUNCTION recalc_rapor_tahfidz();

-- 8. View: Ranking Santri per Kelas & Semester (الترتيب)
CREATE OR REPLACE VIEW v_ranking_tahfidz AS
SELECT 
    r.id AS rapor_id,
    s.id AS santri_id,
    s.nis,
    s.nama,
    s.kelas,
    t.nama AS tahun_ajaran,
    t.semester,
    r.total_nilai,
    r.rata_rata,
    r.predikat_akhir,
    DENSE_RANK() OVER (
        PARTITION BY r.tahun_ajaran_id, s.kelas 
        ORDER BY r.rata_rata DESC, r.total_nilai DESC
    ) AS ranking
FROM rapor_tahfidz r
JOIN santri s ON r.santri_id = s.id
JOIN tahun_ajaran t ON r.tahun_ajaran_id = t.id;

-- 9. Row Level Security (RLS) Baseline (Free Supabase Tier)
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahun_ajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_tahfidz ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai_juz ENABLE ROW LEVEL SECURITY;

-- Public Read / Anon Read untuk fase development (bisa disesuaikan auth di Fase 3)
CREATE POLICY "Public Read Santri" ON santri FOR SELECT USING (true);
CREATE POLICY "Public Read Tahun Ajaran" ON tahun_ajaran FOR SELECT USING (true);
CREATE POLICY "Public Read Rapor" ON rapor_tahfidz FOR SELECT USING (true);
CREATE POLICY "Public Read Nilai Juz" ON nilai_juz FOR SELECT USING (true);
CREATE POLICY "Allow All Insert/Update Dev" ON santri FOR ALL USING (true);
CREATE POLICY "Allow All Insert/Update Rapor Dev" ON rapor_tahfidz FOR ALL USING (true);
CREATE POLICY "Allow All Insert/Update Nilai Dev" ON nilai_juz FOR ALL USING (true);
