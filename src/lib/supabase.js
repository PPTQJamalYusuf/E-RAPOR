import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SUPABASE_URL) || 'https://srsooqrhledihkftdqpm.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_OeZVBu78zMKVlHT9Qo_WDQ_i8NF7X3W';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Otentikasi User (Admin / Guru) dari tabel app_users
 */
export async function authenticateUser(username, password) {
  try {
    const cleanUsername = username.trim().toLowerCase();
    
    // 1. Coba lewat RPC login_user (Metode Aman dengan RLS)
    const { data: rpcUser, error: rpcError } = await supabase.rpc('login_user', {
      p_username: cleanUsername,
      p_password: password
    });

    if (!rpcError && rpcUser) {
      return { success: true, user: rpcUser };
    }

    // 2. Fallback query langsung jika RPC belum dipasang di Supabase
    if (rpcError && (rpcError.code === '42883' || rpcError.message?.includes('function login_user'))) {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, nama, role, kelas_binaan, is_active')
        .eq('username', cleanUsername)
        .eq('password_hash', password)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { success: false, error: 'Username atau password keliru!' };
      }
      return { success: true, user: data };
    }

    return { success: false, error: 'Username atau password keliru!' };
  } catch (err) {
    return { success: false, error: err.message || 'Terjadi kesalahan sistem' };
  }
}

/**
 * Mengambil daftar periode semester
 */
export async function getAcademicPeriods() {
  const { data, error } = await supabase
    .from('academic_periods')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Gagal mengambil periode:', error);
    return [];
  }
  return data || [];
}

/**
 * Menambahkan periode semester baru (Khusus Admin)
 */
export async function addAcademicPeriod(tahunAjaran, semester, setActive = true) {
  if (setActive) {
    // Nonaktifkan semua periode lain
    await supabase.from('academic_periods').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  }
  const { data, error } = await supabase
    .from('academic_periods')
    .insert([{ tahun_ajaran: tahunAjaran, semester: semester, is_active: setActive }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Mengubah periode aktif sekolah (Khusus Admin)
 * Periode yang diaktifkan Admin otomatis diikuti oleh semua akun guru
 */
export async function setActiveAcademicPeriod(periodId) {
  await supabase.from('academic_periods').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  const { data, error } = await supabase
    .from('academic_periods')
    .update({ is_active: true })
    .eq('id', periodId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Mengambil data santri beserta nilai rapor untuk periode tertentu
 */
export async function getSantriWithGrades(periodId) {
  // 1. Ambil semua santri
  const { data: santriList, error: errSantri } = await supabase
    .from('santri')
    .select('*')
    .order('nama', { ascending: true });

  if (errSantri) throw errSantri;

  // 2. Ambil nilai rapor di periode aktif
  let raporMap = {};
  if (periodId) {
    const { data: raporList, error: errRapor } = await supabase
      .from('rapor_tahfidz')
      .select('*')
      .eq('period_id', periodId);

    if (!errRapor && raporList) {
      raporList.forEach(r => {
        raporMap[r.santri_id] = r;
      });
    }
  }

  // 3. Gabungkan data santri dengan nilai rapor
  return santriList.map(s => {
    const rapor = raporMap[s.id] || {};
    return {
      id: s.id,
      nis: s.nis,
      nama: s.nama,
      kelas: s.kelas,
      halqah: s.halqah,
      nilaiJuz: rapor.nilai_juz || {},
      catatan: rapor.catatan || '',
      jumlahHafalan: rapor.jumlah_hafalan || ''
    };
  });
}

/**
 * Menyimpan / memperbarui nilai rapor santri ke Supabase
 */
export async function saveSantriRapor(periodId, santriId, nilaiJuz, catatan, jumlahHafalan) {
  const { data, error } = await supabase
    .from('rapor_tahfidz')
    .upsert({
      period_id: periodId,
      santri_id: santriId,
      nilai_juz: nilaiJuz || {},
      catatan: catatan || '',
      jumlah_hafalan: jumlahHafalan || '',
      updated_at: new Date().toISOString()
    }, { onConflict: 'period_id,santri_id' })
    .select();

  if (error) throw error;
  return data;
}

/**
 * Manajemen Pengguna (Admin)
 */
export async function getAppUsers() {
  // Coba lewat RPC get_all_users
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_users');
  if (!rpcError && rpcData) {
    return rpcData;
  }

  // Fallback query tabel langsung
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, nama, role, kelas_binaan, is_active, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createAppUser({ username, password, nama, role, kelas_binaan }) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanNama = nama.trim();

  // Coba lewat RPC create_app_user
  const { data: rpcUser, error: rpcError } = await supabase.rpc('create_app_user', {
    p_username: cleanUsername,
    p_password: password,
    p_nama: cleanNama,
    p_role: role || 'guru',
    p_kelas_binaan: kelas_binaan || 'Semua'
  });

  if (!rpcError && rpcUser) {
    return rpcUser;
  }

  // Fallback insert langsung
  const { data, error } = await supabase
    .from('app_users')
    .insert([{
      username: cleanUsername,
      password_hash: password,
      nama: cleanNama,
      role: role || 'guru',
      kelas_binaan: kelas_binaan || 'Semua',
      is_active: true
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAppUser(id, updates) {
  // Coba lewat RPC update_app_user
  const { data: rpcUser, error: rpcError } = await supabase.rpc('update_app_user', {
    p_id: id,
    p_updates: updates
  });

  if (!rpcError && rpcUser) {
    return rpcUser;
  }

  // Fallback update langsung
  const payload = { ...updates };
  if (payload.password) {
    payload.password_hash = payload.password;
    delete payload.password;
  }
  const { data, error } = await supabase
    .from('app_users')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAppUser(id) {
  // Coba lewat RPC delete_app_user
  const { data: rpcSuccess, error: rpcError } = await supabase.rpc('delete_app_user', {
    p_id: id
  });

  if (!rpcError && rpcSuccess !== undefined) {
    return true;
  }

  // Fallback delete langsung
  const { error } = await supabase
    .from('app_users')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
