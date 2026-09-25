-- ==============================================================================
-- Prosedur Kenaikan Kelas & Perbaikan Data Santri di Supabase
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. KENAIKAN KELAS MASSAL (Akhir Tahun Ajaran)
-- Query atomik (CASE statement): mencegah bentrok tingkatan kelas.
-- Santri kelas 6 otomatis diubah menjadi 'alumni'.
-- ------------------------------------------------------------------------------
UPDATE santri
SET 
    kelas = CASE 
        WHEN kelas = 'الخامس' THEN 'السادس' -- Kelas 5 -> Kelas 6
        WHEN kelas = 'الرابع' THEN 'الخامس' -- Kelas 4 -> Kelas 5
        WHEN kelas = 'الثالث' THEN 'الرابع' -- Kelas 3 -> Kelas 4
        WHEN kelas = 'الثاني' THEN 'الثالث' -- Kelas 2 -> Kelas 3
        WHEN kelas = 'الأول'  THEN 'الثاني' -- Kelas 1 -> Kelas 2
        ELSE kelas
    END,
    status = CASE 
        WHEN kelas = 'السادس' THEN 'alumni' -- Kelas 6 tamat & jadi alumni
        ELSE status
    END
WHERE status = 'aktif';

-- ------------------------------------------------------------------------------
-- 2. KENAIKAN KELAS / PERBAIKAN DATA PER SANTRI (Berdasarkan NIS)
-- ------------------------------------------------------------------------------
-- Contoh: Ubah kelas Ainayya Nuriel Ihsan (ST-0002) menjadi Kelas 2
UPDATE santri 
SET kelas = 'الثاني'
WHERE nis = 'ST-0002';

-- Contoh: Perbaikan nama santri
UPDATE santri 
SET nama = 'Nama Lengkap Baru'
WHERE nis = 'ST-0001';

-- ------------------------------------------------------------------------------
-- 3. STORED PROCEDURE SUPABASE (Bisa Dipanggil dari Frontend / RPC)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION proses_kenaikan_kelas_massal()
RETURNS JSON AS $$
DECLARE
    v_total_promoted INT;
    v_total_alumni INT;
BEGIN
    -- Update santri kelas 6 menjadi alumni
    UPDATE santri
    SET status = 'alumni'
    WHERE kelas = 'السادس' AND status = 'aktif';
    GET DIAGNOSTICS v_total_alumni = ROW_COUNT;

    -- Naikkan kelas 1 s/d 5
    UPDATE santri
    SET kelas = CASE 
        WHEN kelas = 'الخامس' THEN 'السادس'
        WHEN kelas = 'الرابع' THEN 'الخامس'
        WHEN kelas = 'الثالث' THEN 'الرابع'
        WHEN kelas = 'الثاني' THEN 'الثالث'
        WHEN kelas = 'الأول'  THEN 'الثاني'
        ELSE kelas
    END
    WHERE status = 'aktif';
    GET DIAGNOSTICS v_total_promoted = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'santri_naik_kelas', v_total_promoted,
        'santri_lulus_alumni', v_total_alumni
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
