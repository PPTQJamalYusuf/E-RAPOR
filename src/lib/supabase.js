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
      is_tahsin: Boolean(s.is_tahsin),
      nilaiJuz: rapor.nilai_juz || {},
      nilaiTahsin: rapor.nilai_tahsin || {},
      catatan: rapor.catatan || '',
      jumlahHafalan: rapor.jumlah_hafalan || ''
    };
  });
}

/**
 * Menyimpan / memperbarui nilai rapor santri ke Supabase (termasuk nilai tahsin jika ada)
 */
export async function saveSantriRapor(periodId, santriId, nilaiJuz, catatan, jumlahHafalan, nilaiTahsin) {
  const payload = {
    period_id: periodId,
    santri_id: santriId,
    nilai_juz: nilaiJuz || {},
    catatan: catatan || '',
    jumlah_hafalan: jumlahHafalan || '',
    updated_at: new Date().toISOString()
  };

  if (nilaiTahsin !== undefined) {
    payload.nilai_tahsin = nilaiTahsin || {};
  }

  const { data, error } = await supabase
    .from('rapor_tahfidz')
    .upsert(payload, { onConflict: 'period_id,santri_id' })
    .select();

  if (error) throw error;
  return data;
}

/**
 * Mengubah status program Tahsin santri (Khusus Admin)
 */
export async function toggleSantriTahsin(santriId, isTahsin) {
  // Coba lewat RPC toggle_santri_tahsin
  const { error: rpcError } = await supabase.rpc('toggle_santri_tahsin', {
    p_santri_id: santriId,
    p_is_tahsin: isTahsin
  });

  if (!rpcError) return true;

  // Fallback update langsung tabel santri
  const { error } = await supabase
    .from('santri')
    .update({ is_tahsin: isTahsin })
    .eq('id', santriId);

  if (error) throw error;
  return true;
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

/**
 * ============================================================================
 * MODUL RAPOR DINIYAH (8 MATA PELAJARAN FORMAL PONDOK)
 * ============================================================================
 */

/**
 * Mengambil data santri beserta nilai rapor Diniyah pada periode semester tertentu
 */
export async function getSantriWithDiniyahGrades(periodId) {
  // 1. Ambil seluruh data master santri
  const { data: santriList, error: santriError } = await supabase
    .from('santri')
    .select('*')
    .order('nis', { ascending: true });

  if (santriError) {
    console.error('Gagal mengambil data master santri:', santriError);
    return [];
  }

  // 2. Ambil seluruh nilai rapor Diniyah pada periode aktif
  let diniyahMap = {};
  if (periodId && periodId !== 'default') {
    const { data: diniyahGrades, error: diniyahError } = await supabase
      .from('rapor_diniyah')
      .select('*')
      .eq('period_id', periodId);

    if (diniyahError) {
      console.warn('Tabel rapor_diniyah belum dibuat atau koneksi offline:', diniyahError);
    } else if (diniyahGrades) {
      diniyahGrades.forEach(r => {
        diniyahMap[r.santri_id] = r;
      });
    }
  }

  // 3. Gabungkan data santri dengan nilai rapor Diniyah
  return santriList.map(s => {
    const r = diniyahMap[s.id] || {};
    return {
      id: s.id,
      nis: s.nis,
      nama: s.nama,
      kelas: s.kelas,
      halqah: s.halqah,
      is_tahsin: Boolean(s.is_tahsin),
      nilaiDiniyah: r.nilai_mapel || {},
      catatanDiniyah: r.catatan || ''
    };
  });
}

/**
 * Menyimpan / memperbarui nilai rapor Diniyah santri ke Supabase Cloud
 */
export async function saveSantriDiniyah(periodId, santriId, nilaiMapel, catatan) {
  const payload = {
    period_id: periodId,
    santri_id: santriId,
    nilai_mapel: nilaiMapel || {},
    catatan: catatan !== undefined ? catatan : '',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('rapor_diniyah')
    .upsert(payload, { onConflict: 'period_id,santri_id' })
    .select();

  if (error) throw error;
  return data;
}

/**
 * Simpan nilai Diniyah massal sekelas untuk 1 mata pelajaran (Input Cepat Per Mapel Ala Excel)
 */
export async function saveBatchDiniyahPerMapel(periodId, mapelId, updatesArray) {
  if (!periodId || !mapelId || !updatesArray || !updatesArray.length) return [];

  const promises = updatesArray.map(async (u) => {
    // Ambil nilai existing terlebih dahulu agar mapel lain tidak tertimpa
    const { data: existing } = await supabase
      .from('rapor_diniyah')
      .select('nilai_mapel, catatan')
      .eq('period_id', periodId)
      .eq('santri_id', u.santriId)
      .maybeSingle();

    const currentNilaiMapel = existing?.nilai_mapel || {};
    if (u.nilai === '' || u.nilai === null || u.nilai === undefined) {
      delete currentNilaiMapel[mapelId];
    } else {
      currentNilaiMapel[mapelId] = Number(u.nilai);
    }

    const payload = {
      period_id: periodId,
      santri_id: u.santriId,
      nilai_mapel: currentNilaiMapel,
      catatan: existing?.catatan || '',
      updated_at: new Date().toISOString()
    };

    return supabase
      .from('rapor_diniyah')
      .upsert(payload, { onConflict: 'period_id,santri_id' });
  });

  return Promise.all(promises);
}

/**
 * Mencatat log aktivitas perubahan nilai via RPC aman (append-only, validasi server).
 */
export async function recordActivityLog({
  actorId,
  module,
  action,
  targetId = null,
  targetName,
  periodId = null,
  summary,
  changes = {}
}) {
  if (!actorId || !module || !action || !targetName || !summary) return null;

  const { data, error } = await supabase.rpc('log_activity', {
    p_actor_id: actorId,
    p_module: module,
    p_action: action,
    p_target_id: targetId ? String(targetId) : null,
    p_target_name: targetName,
    p_period_id: periodId ? String(periodId) : null,
    p_summary: summary,
    p_changes: changes || {}
  });

  if (error) throw error;
  return data;
}

/**
 * Mengambil riwayat log aktivitas (khusus Admin, diverifikasi di server Supabase).
 */
export async function fetchActivityLogs({
  adminId,
  module = 'all',
  search = '',
  limit = 30,
  offset = 0
}) {
  if (!adminId) {
    throw new Error('Sesi admin tidak valid. Silakan login kembali.');
  }

  const { data, error } = await supabase.rpc('get_activity_logs', {
    p_admin_id: adminId,
    p_module: module,
    p_search: search,
    p_limit: limit,
    p_offset: offset
  });

  if (error) {
    if (error.code === '42883' || error.message?.includes('get_activity_logs')) {
      throw new Error('Tabel log aktivitas belum dipasang di Supabase. Jalankan skrip SQL 20261118_add_activity_logs.sql terlebih dahulu.');
    }
    throw new Error(error.message || 'Gagal memuat riwayat aktivitas dari server.');
  }

  return data || [];
}

/**
 * Menghapus 1 baris log aktivitas berdasarkan ID (khusus Admin via RPC).
 */
export async function deleteActivityLog(adminId, logId) {
  if (!adminId || !logId) {
    throw new Error('Data permintaan hapus log tidak lengkap.');
  }

  const { error } = await supabase.rpc('delete_activity_log', {
    p_admin_id: adminId,
    p_log_id: logId
  });

  if (error) {
    if (error.code === '42883' || error.message?.includes('delete_activity_log')) {
      throw new Error('Fungsi hapus log belum dipasang di Supabase. Jalankan skrip SQL 20261118_add_delete_activity_logs_rpc.sql terlebih dahulu.');
    }
    throw new Error(error.message || 'Gagal menghapus log aktivitas.');
  }

  return true;
}

/**
 * Membersihkan seluruh log aktivitas atau berdasarkan modul tertentu (khusus Admin via RPC).
 */
export async function clearActivityLogs(adminId, module = 'all') {
  if (!adminId) {
    throw new Error('Sesi admin tidak valid. Silakan login kembali.');
  }

  const { data, error } = await supabase.rpc('clear_activity_logs', {
    p_admin_id: adminId,
    p_module: module
  });

  if (error) {
    if (error.code === '42883' || error.message?.includes('clear_activity_logs')) {
      throw new Error('Fungsi bersihkan log belum dipasang di Supabase. Jalankan skrip SQL 20261118_add_delete_activity_logs_rpc.sql terlebih dahulu.');
    }
    throw new Error(error.message || 'Gagal membersihkan log aktivitas.');
  }

  return Number(data || 0);
}
