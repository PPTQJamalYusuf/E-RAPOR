-- ==============================================================================
-- MIGRATION: Modul Rapor Diniyah & Pemisahan Role Guru (Tahfidz vs Diniyah)
-- 100% Non-destruktif terhadap tabel rapor_tahfidz & santri
-- ==============================================================================

-- 1. Buat Tabel Transaksi: rapor_diniyah
CREATE TABLE IF NOT EXISTS rapor_diniyah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
    santri_id UUID NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
    nilai_mapel JSONB DEFAULT '{}'::jsonb, -- { tauhid: 90, fiqh: 85, ... }
    catatan TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_santri_diniyah_period UNIQUE (period_id, santri_id)
);

-- 2. Aktifkan RLS dan Policy untuk rapor_diniyah (Akses publik bebas akses sesuai sistem saat ini)
ALTER TABLE IF EXISTS rapor_diniyah ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public All Rapor Diniyah" ON rapor_diniyah;
CREATE POLICY "Public All Rapor Diniyah" ON rapor_diniyah FOR ALL USING (true);

-- 3. Update dokumentasi peran pada app_users:
-- Peran yang didukung:
-- - 'admin'         : Administrator Pondok (akses Tahfidz, Diniyah, Pengaturan)
-- - 'guru_tahfidz'  : Guru Tahfidz (akses khusus E-Rapor Tahfidz)
-- - 'guru_diniyah'  : Guru Diniyah (akses khusus E-Rapor Diniyah)
-- - 'guru'          : Kompatibilitas mundur untuk guru lama (diperlakukan sebagai Guru Tahfidz)
