-- ==============================================================================
-- FILE   : supabase/migrations/20261118_add_delete_activity_logs_rpc.sql
-- TUJUAN : Menambahkan 2 RPC aman khusus Admin untuk menghapus 1 baris log atau
--          membersihkan log aktivitas per modul / semua.
-- CALLER : Dijalankan 1x di Supabase SQL Editor; dipanggil dari src/lib/supabase.js
-- DEPS   : Tabel activity_logs & app_users
-- EFEK   : Menambah fungsi RPC delete_activity_log & clear_activity_logs
-- ==============================================================================

-- 1. RPC: Hapus 1 baris log berdasarkan ID (khusus Admin aktif)
CREATE OR REPLACE FUNCTION delete_activity_log(
    p_admin_id UUID,
    p_log_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM app_users
        WHERE id = p_admin_id
          AND role = 'admin'
          AND is_active = true
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat menghapus log aktivitas.';
    END IF;

    DELETE FROM activity_logs WHERE id = p_log_id;
    RETURN true;
END;
$$;

-- 2. RPC: Bersihkan log aktivitas (semua atau per modul tertentu, khusus Admin aktif)
CREATE OR REPLACE FUNCTION clear_activity_logs(
    p_admin_id UUID,
    p_module TEXT DEFAULT 'all'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_clean_module TEXT;
    v_deleted_count INT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM app_users
        WHERE id = p_admin_id
          AND role = 'admin'
          AND is_active = true
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat membersihkan log aktivitas.';
    END IF;

    v_clean_module := NULLIF(LOWER(TRIM(COALESCE(p_module, 'all'))), '');

    IF v_clean_module IS NULL OR v_clean_module = 'all' THEN
        -- Wajib menyertakan klausa WHERE karena Supabase mengaktifkan pg_safeupdate
        DELETE FROM activity_logs WHERE id IS NOT NULL;
    ELSE
        DELETE FROM activity_logs WHERE module = v_clean_module;
    END IF;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;
