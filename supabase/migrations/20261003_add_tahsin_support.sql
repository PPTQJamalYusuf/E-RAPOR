-- ==============================================================================
-- PENAMBAHAN FITUR PROGRAM TAHSIN (KHUSUS SANTRI TERTENTU)
-- Menjaga 95% santri reguler tetap aman & tidak terpengaruh
-- ==============================================================================

-- 1. Tambah kolom flag is_tahsin pada tabel santri
ALTER TABLE IF EXISTS santri 
ADD COLUMN IF NOT EXISTS is_tahsin BOOLEAN DEFAULT false;

-- 2. Tambah kolom nilai_tahsin pada tabel rapor_tahfidz
ALTER TABLE IF EXISTS rapor_tahfidz 
ADD COLUMN IF NOT EXISTS nilai_tahsin JSONB DEFAULT '{}'::jsonb;

-- 3. Fungsi RPC untuk Admin mengubah status Tahsin santri secara aman
CREATE OR REPLACE FUNCTION toggle_santri_tahsin(p_santri_id UUID, p_is_tahsin BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE santri
  SET is_tahsin = p_is_tahsin
  WHERE id = p_santri_id;
  
  RETURN true;
END;
$$;
