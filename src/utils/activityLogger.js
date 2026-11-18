// ============================================================
// FILE   : src/utils/activityLogger.js
// TUJUAN : Menghitung selisih perubahan nilai (auto-diff) dan
//          mencatat log aktivitas secara non-blocking ke Supabase.
// CALLER : src/App.jsx
// DEPS   : src/lib/supabase.js, src/utils/tahfidzCalc.js,
//          src/utils/diniyahCalc.js
// EFEK   : Menulis baris audit ke tabel activity_logs via RPC
// ============================================================

import { recordActivityLog } from '../lib/supabase';
import { KRITERIA_TAHSIN, formatNamaKelas } from './tahfidzCalc';
import { MATA_PELAJARAN_DINIYAH } from './diniyahCalc';

const MAX_SUMMARY_ITEMS = 3;

/**
 * Normalisasi nilai agar perbandingan lama vs baru akurat
 * (menghindari false diff antara "", null, undefined, atau "90" vs 90).
 */
function normalizeValue(val, isNumeric = false) {
  if (val === undefined || val === null || val === '') return null;
  if (isNumeric) {
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  }
  const trimmed = String(val).trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Format label nilai kosong/isi untuk teks ringkasan log.
 */
function formatShortVal(val) {
  if (val === null || val === undefined || val === '') return 'kosong';
  const str = String(val);
  return str.length > 28 ? `${str.slice(0, 28)}…` : str;
}

/**
 * Susun teks ringkasan singkat yang mudah dibaca manusia dari objek changes.
 */
function buildSummaryText(changes, prefix = 'Ubah') {
  const entries = Object.entries(changes);
  if (entries.length === 0) return '';

  const preview = entries.slice(0, MAX_SUMMARY_ITEMS).map(([label, { old: oldVal, new: newVal }]) => {
    return `${label} (${formatShortVal(oldVal)} → ${formatShortVal(newVal)})`;
  });

  const remaining = entries.length - MAX_SUMMARY_ITEMS;
  const suffix = remaining > 0 ? `, +${remaining} lainnya` : '';
  return `${prefix} ${preview.join(', ')}${suffix}`;
}

/**
 * Format nama target santri beserta kelasnya.
 */
export function formatTargetSantri(santri) {
  if (!santri) return 'Santriwati';
  const kelasLabel = santri.kelas ? formatNamaKelas(santri.kelas) : '';
  return kelasLabel ? `${santri.nama} (${kelasLabel})` : santri.nama;
}

/**
 * Hitung diff perubahan nilai Tahfidz (Juz 1–30), Tahsin (7 kriteria),
 * jumlah hafalan, dan catatan. Mengembalikan null jika tidak ada perubahan.
 */
export function buildTahfidzDiff(oldSantri, newNilaiJuz, newCatatan, newJumlahHafalan, newNilaiTahsin) {
  if (!oldSantri) return null;

  const changes = {};
  let hasTahfidzChange = false;
  let hasTahsinChange = false;

  // 1. Cek perubahan nilai Juz 1–30
  const oldJuz = oldSantri.nilaiJuz || {};
  const nextJuz = newNilaiJuz || {};
  for (let j = 1; j <= 30; j++) {
    const oldVal = normalizeValue(oldJuz[j], true);
    const newVal = normalizeValue(nextJuz[j], true);
    if (oldVal !== newVal) {
      changes[`Juz ${j}`] = { old: oldVal, new: newVal };
      hasTahfidzChange = true;
    }
  }

  // 2. Cek perubahan nilai Tahsin (jika dikirim)
  if (newNilaiTahsin !== undefined) {
    const oldTahsin = oldSantri.nilaiTahsin || {};
    const nextTahsin = newNilaiTahsin || {};
    KRITERIA_TAHSIN.forEach((k) => {
      const oldVal = normalizeValue(oldTahsin[k.id], true);
      const newVal = normalizeValue(nextTahsin[k.id], true);
      if (oldVal !== newVal) {
        changes[`Tahsin: ${k.labelId}`] = { old: oldVal, new: newVal };
        hasTahsinChange = true;
      }
    });
  }

  // 3. Cek perubahan jumlah hafalan
  if (newJumlahHafalan !== undefined) {
    const oldHaf = normalizeValue(oldSantri.jumlahHafalan, false);
    const newHaf = normalizeValue(newJumlahHafalan, false);
    if (oldHaf !== newHaf) {
      changes['Jumlah Hafalan'] = { old: oldHaf, new: newHaf };
      hasTahfidzChange = true;
    }
  }

  // 4. Cek perubahan catatan
  if (newCatatan !== undefined) {
    const oldCat = normalizeValue(oldSantri.catatan, false);
    const newCat = normalizeValue(newCatatan, false);
    if (oldCat !== newCat) {
      changes['Catatan'] = { old: oldCat, new: newCat };
      if (!hasTahsinChange) hasTahfidzChange = true;
    }
  }

  if (Object.keys(changes).length === 0) return null;

  const moduleName = hasTahsinChange && !hasTahfidzChange ? 'tahsin' : 'tahfidz';
  return {
    module: moduleName,
    action: moduleName === 'tahsin' ? 'UPDATE_TAHSIN' : 'UPDATE_TAHFIDZ',
    targetId: oldSantri.id,
    targetName: formatTargetSantri(oldSantri),
    summary: buildSummaryText(changes),
    changes
  };
}

/**
 * Hitung diff perubahan nilai Diniyah per santriwati (8 mapel + catatan).
 * Mengembalikan null jika tidak ada perubahan.
 */
export function buildDiniyahSiswaDiff(oldSantri, newNilaiMapel, newCatatan) {
  if (!oldSantri) return null;

  const changes = {};
  const oldMapel = oldSantri.nilaiDiniyah || {};
  const nextMapel = newNilaiMapel || {};

  MATA_PELAJARAN_DINIYAH.forEach((m) => {
    const oldVal = normalizeValue(oldMapel[m.id], true);
    const newVal = normalizeValue(nextMapel[m.id], true);
    if (oldVal !== newVal) {
      changes[m.labelId] = { old: oldVal, new: newVal };
    }
  });

  if (newCatatan !== undefined) {
    const oldCat = normalizeValue(oldSantri.catatanDiniyah, false);
    const newCat = normalizeValue(newCatatan, false);
    if (oldCat !== newCat) {
      changes['Catatan Diniyah'] = { old: oldCat, new: newCat };
    }
  }

  if (Object.keys(changes).length === 0) return null;

  return {
    module: 'diniyah',
    action: 'UPDATE_DINIYAH',
    targetId: oldSantri.id,
    targetName: formatTargetSantri(oldSantri),
    summary: buildSummaryText(changes),
    changes
  };
}

/**
 * Hitung diff gabungan untuk input massal Diniyah per mapel sekelas.
 * Dicatat sebagai 1 baris log ringkas agar hemat penyimpanan database.
 */
export function buildBatchDiniyahDiff(santriList, kelas, mapelId, updates) {
  if (!updates || updates.length === 0) return null;

  const mapelInfo = MATA_PELAJARAN_DINIYAH.find((m) => m.id === mapelId);
  const mapelLabel = mapelInfo?.labelId || mapelId;
  const kelasLabel = formatNamaKelas(kelas);

  const changes = {};
  updates.forEach((u) => {
    const santri = santriList.find((s) => s.id === u.santriId);
    if (!santri) return;
    const oldVal = normalizeValue(santri.nilaiDiniyah?.[mapelId], true);
    const newVal = normalizeValue(u.nilai, true);
    if (oldVal !== newVal) {
      changes[santri.nama] = { old: oldVal, new: newVal };
    }
  });

  const changedCount = Object.keys(changes).length;
  if (changedCount === 0) return null;

  return {
    module: 'diniyah',
    action: 'BATCH_DINIYAH',
    targetId: `${kelas}:${mapelId}`,
    targetName: `Mapel ${mapelLabel} — ${kelasLabel}`,
    summary: `Update massal ${mapelLabel} (${changedCount} santriwati diubah)`,
    changes
  };
}

/**
 * Wrapper pencatat log bersifat fail-safe (non-blocking).
 * Error pencatatan log tidak pernah membatalkan proses simpan nilai utama.
 */
export async function safeLogActivity(payload) {
  if (!payload || !payload.actorId) return;
  try {
    await recordActivityLog(payload);
  } catch (err) {
    console.warn('Log aktivitas gagal dikirim (non-blocking):', err?.message || err);
  }
}
