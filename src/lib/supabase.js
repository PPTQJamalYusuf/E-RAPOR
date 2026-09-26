import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SUPABASE_URL) || 'https://srsooqrhledihkftdqpm.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_OeZVBu78zMKVlHT9Qo_WDQ_i8NF7X3W';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Otentikasi User (Admin / Guru) dari tabel app_users
 */
export async function authenticateUser(username, password) {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username.trim().toLowerCase())
      .eq('password_hash', password)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { success: false, error: 'Username atau password keliru!' };
    }
    return { success: true, user: data };
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
 * Menambahkan periode semester baru
 */
export async function addAcademicPeriod(tahunAjaran, semester) {
  const { data, error } = await supabase
    .from('academic_periods')
    .insert([{ tahun_ajaran: tahunAjaran, semester: semester, is_active: false }])
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
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, nama, role, kelas_binaan, is_active, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createAppUser({ username, password, nama, role, kelas_binaan }) {
  const { data, error } = await supabase
    .from('app_users')
    .insert([{
      username: username.trim().toLowerCase(),
      password_hash: password,
      nama: nama.trim(),
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
  const { error } = await supabase
    .from('app_users')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
