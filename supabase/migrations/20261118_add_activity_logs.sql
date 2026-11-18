-- ==============================================================================
-- FILE   : supabase/migrations/20261118_add_activity_logs.sql
-- TUJUAN : Membuat tabel audit/activity_logs (append-only) dan RPC aman untuk
--          mencatat & membaca riwayat perubahan nilai E-Rapor.
-- CALLER : Dijalankan 1x di Supabase SQL Editor; dipanggil via RPC dari
--          src/lib/supabase.js & src/utils/activityLogger.js
-- DEPS   : Tabel app_users (validasi aktor & otorisasi admin)
-- EFEK   : Menambah tabel activity_logs, index, RLS, dan 2 fungsi RPC
--          (100% non-destruktif terhadap data & tabel yang sudah ada)
-- ==============================================================================

-- 1. Buat Tabel Audit: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id UUID,
    actor_username VARCHAR(100) NOT NULL,
    actor_nama VARCHAR(150) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    module VARCHAR(30) NOT NULL,          -- 'tahfidz' | 'tahsin' | 'diniyah'
    action VARCHAR(50) NOT NULL,          -- 'UPDATE_NILAI' | 'TOGGLE_TAHSIN' | 'UPDATE_DINIYAH' | 'BATCH_DINIYAH'
    target_id TEXT,
    target_name VARCHAR(200) NOT NULL,
    period_id TEXT,
    summary TEXT NOT NULL,
    changes JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Index untuk filter cepat & pagination ringan
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
    ON activity_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_module_created
    ON activity_logs (module, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_period_created
    ON activity_logs (period_id, created_at DESC);

-- 3. Kunci tabel dengan RLS (Append-only: anon tidak bisa baca/edit/hapus langsung)
ALTER TABLE IF EXISTS activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public All Activity Logs" ON activity_logs;
DROP POLICY IF EXISTS "Public Read Activity Logs" ON activity_logs;

-- 4. RPC: Catat Log Aktivitas (Validasi aktor dari app_users di sisi server)
CREATE OR REPLACE FUNCTION log_activity(
    p_actor_id UUID,
    p_module TEXT,
    p_action TEXT,
    p_target_id TEXT,
    p_target_name TEXT,
    p_period_id TEXT,
    p_summary TEXT,
    p_changes JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor RECORD;
    v_log_id UUID;
BEGIN
    -- Guard clause: pastikan aktor valid & aktif di app_users (cegah spoofing)
    SELECT id, username, nama, role
    INTO v_actor
    FROM app_users
    WHERE id = p_actor_id
      AND is_active = true
    LIMIT 1;

    IF v_actor IS NULL THEN
        RAISE EXCEPTION 'Aktor tidak valid atau tidak aktif.';
    END IF;

    -- Guard clause: pastikan ringkasan & target tidak kosong
    IF COALESCE(TRIM(p_summary), '') = '' OR COALESCE(TRIM(p_target_name), '') = '' THEN
        RAISE EXCEPTION 'Data log tidak lengkap.';
    END IF;

    INSERT INTO activity_logs (
        actor_id,
        actor_username,
        actor_nama,
        actor_role,
        module,
        action,
        target_id,
        target_name,
        period_id,
        summary,
        changes
    )
    VALUES (
        v_actor.id,
        v_actor.username,
        v_actor.nama,
        v_actor.role,
        LOWER(TRIM(p_module)),
        UPPER(TRIM(p_action)),
        p_target_id,
        TRIM(p_target_name),
        p_period_id,
        TRIM(p_summary),
        COALESCE(p_changes, '{}'::jsonb)
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- 5. RPC: Baca Log Aktivitas (Khusus Admin, dengan filter & pagination aman)
CREATE OR REPLACE FUNCTION get_activity_logs(
    p_admin_id UUID,
    p_module TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 30,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    actor_id UUID,
    actor_username VARCHAR,
    actor_nama VARCHAR,
    actor_role VARCHAR,
    module VARCHAR,
    action VARCHAR,
    target_id TEXT,
    target_name VARCHAR,
    period_id TEXT,
    summary TEXT,
    changes JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_safe_limit INT;
    v_safe_offset INT;
    v_clean_module TEXT;
    v_clean_search TEXT;
BEGIN
    -- Guard clause: verifikasi pemanggil adalah admin aktif di server
    SELECT EXISTS (
        SELECT 1
        FROM app_users
        WHERE app_users.id = p_admin_id
          AND app_users.role = 'admin'
          AND app_users.is_active = true
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat melihat riwayat aktivitas.';
    END IF;

    v_safe_limit := LEAST(GREATEST(COALESCE(p_limit, 30), 1), 100);
    v_safe_offset := GREATEST(COALESCE(p_offset, 0), 0);
    v_clean_module := NULLIF(LOWER(TRIM(COALESCE(p_module, ''))), '');
    v_clean_search := NULLIF(TRIM(COALESCE(p_search, '')), '');

    RETURN QUERY
    SELECT
        l.id,
        l.created_at,
        l.actor_id,
        l.actor_username,
        l.actor_nama,
        l.actor_role,
        l.module,
        l.action,
        l.target_id,
        l.target_name,
        l.period_id,
        l.summary,
        l.changes
    FROM activity_logs l
    WHERE (v_clean_module IS NULL OR v_clean_module = 'all' OR l.module = v_clean_module)
      AND (
          v_clean_search IS NULL
          OR l.target_name ILIKE '%' || v_clean_search || '%'
          OR l.actor_nama ILIKE '%' || v_clean_search || '%'
          OR l.summary ILIKE '%' || v_clean_search || '%'
      )
    ORDER BY l.created_at DESC
    LIMIT v_safe_limit
    OFFSET v_safe_offset;
END;
$$;
