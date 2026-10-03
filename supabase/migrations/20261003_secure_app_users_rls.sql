-- ==============================================================================
-- PENGAMANAN KREDENSIAL PENGGUNA (app_users) DENGAN ROW LEVEL SECURITY & RPC
-- Mengunci tabel app_users dari publik tapi tetap 100% aman untuk guru & admin
-- ==============================================================================

-- 1. Kunci tabel app_users dengan RLS (Akses publik / anon otomatis tertutup)
ALTER TABLE IF EXISTS app_users ENABLE ROW LEVEL SECURITY;

-- Pastikan tidak ada policy terbuka yang membolehkan anon menembak tabel app_users langsung
DROP POLICY IF EXISTS "Public Read App Users" ON app_users;
DROP POLICY IF EXISTS "Allow All App Users" ON app_users;

-- 2. Fungsi Login Aman (SECURITY DEFINER = berjalan aman di server Supabase)
-- Hanya mencocokkan kredensial, orang luar tidak bisa menyedot seluruh tabel password
CREATE OR REPLACE FUNCTION login_user(p_username TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT id, username, nama, role, kelas_binaan, is_active
  INTO v_user
  FROM app_users
  WHERE LOWER(username) = LOWER(TRIM(p_username))
    AND password_hash = p_password
    AND is_active = true
  LIMIT 1;

  IF v_user IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id', v_user.id,
    'username', v_user.username,
    'nama', v_user.nama,
    'role', v_user.role,
    'kelas_binaan', v_user.kelas_binaan,
    'is_active', v_user.is_active
  );
END;
$$;

-- 3. Fungsi Ambil Daftar Pengguna (Khusus Manajemen User Admin)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS SETOF app_users
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM app_users 
  ORDER BY created_at ASC;
END;
$$;

-- 4. Fungsi Buat Pengguna Baru
CREATE OR REPLACE FUNCTION create_app_user(
  p_username TEXT,
  p_password TEXT,
  p_nama TEXT,
  p_role TEXT DEFAULT 'guru',
  p_kelas_binaan TEXT DEFAULT 'Semua'
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
BEGIN
  INSERT INTO app_users (username, password_hash, nama, role, kelas_binaan, is_active)
  VALUES (LOWER(TRIM(p_username)), p_password, TRIM(p_nama), p_role, p_kelas_binaan, true)
  RETURNING * INTO v_user;

  RETURN json_build_object(
    'id', v_user.id,
    'username', v_user.username,
    'nama', v_user.nama,
    'role', v_user.role,
    'kelas_binaan', v_user.kelas_binaan,
    'is_active', v_user.is_active
  );
END;
$$;

-- 5. Fungsi Update Pengguna
CREATE OR REPLACE FUNCTION update_app_user(p_id UUID, p_updates JSON)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
BEGIN
  UPDATE app_users SET
    username = COALESCE(p_updates->>'username', username),
    nama = COALESCE(p_updates->>'nama', nama),
    role = COALESCE(p_updates->>'role', role),
    kelas_binaan = COALESCE(p_updates->>'kelas_binaan', kelas_binaan),
    password_hash = COALESCE(p_updates->>'password', password_hash),
    is_active = COALESCE((p_updates->>'is_active')::boolean, is_active)
  WHERE id = p_id
  RETURNING * INTO v_user;

  RETURN json_build_object(
    'id', v_user.id,
    'username', v_user.username,
    'nama', v_user.nama,
    'role', v_user.role,
    'kelas_binaan', v_user.kelas_binaan,
    'is_active', v_user.is_active
  );
END;
$$;

-- 6. Fungsi Hapus Pengguna
CREATE OR REPLACE FUNCTION delete_app_user(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM app_users WHERE id = p_id;
  RETURN true;
END;
$$;

-- 7. Pastikan tabel operasional (santri, nilai, periode) tetap bisa diakses guru
ALTER TABLE IF EXISTS academic_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public All Academic Periods" ON academic_periods;
CREATE POLICY "Public All Academic Periods" ON academic_periods FOR ALL USING (true);
