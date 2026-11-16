/**
 * Definisi Mata Pelajaran, KKM, dan Rumus Perhitungan Rapor Diniyah
 * Menyesuaikan 100% template resmi: 'Master Diniyah New.xlsx' & 'Ranking.xlsx'
 */

// 1. Daftar 8 Mata Pelajaran Resmi Diniyah Pondok
export const MATA_PELAJARAN_DINIYAH = [
  { id: 'tauhid', labelAr: 'التوحيد', labelId: 'Tauhid', nama: 'Tauhid', arab: 'التوحيد' },
  { id: 'tajwid', labelAr: 'التجويد', labelId: 'Tajwid', nama: 'Tajwid', arab: 'التجويد' },
  { id: 'fiqh', labelAr: 'الفقه', labelId: 'Fiqih', nama: 'Fiqih', arab: 'الفقه' },
  { id: 'b_arab', labelAr: 'اللغة العربية', labelId: 'Bahasa Arab', nama: 'Bahasa Arab', arab: 'اللغة العربية' },
  { id: 'kitabah', labelAr: 'الكتابة', labelId: 'Kitabah / Imla\'', nama: 'Kitabah / Imla\'', arab: 'الكتابة' },
  { id: 'nahwu_shorof', labelAr: 'النحو والصرف', labelId: 'Nahwu & Shorof', nama: 'Nahwu & Shorof', arab: 'النحو والصرف' },
  { id: 'ad_iyah', labelAr: 'الأدعية', labelId: 'Doa-doa Harian', nama: 'Doa-doa Harian', arab: 'الأدعية' },
  { id: 'hadits', labelAr: 'حفظ الأحاديث', labelId: 'Hafalan Hadits', nama: 'Hafalan Hadits', arab: 'حفظ الأحاديث' }
];

// 2. KKM & Predikat Diniyah Resmi (Sesuai Rumus Excel: >=90 Mumtaz, >=80 Jayyid Jiddan, >=70 Jayyid, >=60 Maqbul, <60 Rasib)
export function getPredikatDiniyah(nilai) {
  if (nilai === null || nilai === undefined || nilai === '') return '';
  const num = Number(nilai);
  if (isNaN(num)) return '';
  const rounded = Math.round(num);
  if (rounded >= 90) return 'ممتاز';
  if (rounded >= 80) return 'جيّد جدا';
  if (rounded >= 70) return 'جيّد';
  if (rounded >= 60) return 'مقبول';
  return 'راسب';
}

export const PREDIKAT_DINIYAH_COLORS = {
  'ممتاز': { bg: '#dcfce7', text: '#15803d', border: '#86efac', label: 'Mumtaz (Sangat Baik / ممتاز)' },
  'جيّد جدا': { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc', label: 'Jayyid Jiddan (Baik Sekali / جيّد جدا)' },
  'جيّد': { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', label: 'Jayyid (Baik / جيّد)' },
  'مقبول': { bg: '#fef9c3', text: '#854d0e', border: '#fde047', label: 'Maqbul (Cukup / مقبول)' },
  'راسب': { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5', label: 'Rasib (Mengulang / راسb)' },
  '-': { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1', label: 'Belum Diisi' }
};

export const PREDIKAT_DINIYAH_LABEL_ID = {
  'ممتاز': 'Sangat Baik',
  'جيّد جدا': 'Baik Sekali',
  'جيّد': 'Baik',
  'مقبول': 'Cukup',
  'راسب': 'Mengulang'
};

/**
 * Kalkulasi Nilai Rapor Diniyah Seorang Santri
 * Menghitung Total Nilai, Rata-rata, dan Predikat Akhir
 */
export function hitungRaporDiniyah(nilaiMapel = {}) {
  let total = 0;
  let count = 0;
  const details = {};

  MATA_PELAJARAN_DINIYAH.forEach(m => {
    const val = nilaiMapel?.[m.id];
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        total += num;
        count += 1;
        details[m.id] = {
          nilai: num,
          predikat: getPredikatDiniyah(num)
        };
      }
    }
  });

  const rataRata = count > 0 ? Number((total / count).toFixed(2)) : 0;
  const predikatAkhir = count > 0 ? getPredikatDiniyah(Math.round(rataRata)) : '-';

  return {
    total,
    count,
    rataRata,
    predikatAkhir,
    details
  };
}

/**
 * Hitung Peringkat / Ranking Diniyah dalam 1 Kelas
 */
export function hitungRankingDiniyah(santriList) {
  const scored = santriList.map(s => {
    const calc = hitungRaporDiniyah(s.nilaiDiniyah || {});
    return {
      ...s,
      calc,
      calcDiniyah: calc
    };
  });

  scored.sort((a, b) => {
    if (b.calcDiniyah.rataRata !== a.calcDiniyah.rataRata) {
      return b.calcDiniyah.rataRata - a.calcDiniyah.rataRata;
    }
    return b.calcDiniyah.total - a.calcDiniyah.total;
  });

  let currentRank = 1;
  return scored.map((item, index) => {
    if (index > 0) {
      const prev = scored[index - 1];
      if (prev.calcDiniyah.rataRata !== item.calcDiniyah.rataRata || prev.calcDiniyah.total !== item.calcDiniyah.total) {
        currentRank = index + 1;
      }
    }
    const finalRank = item.calcDiniyah.count > 0 ? currentRank : '-';
    return {
      ...item,
      ranking: finalRank,
      rankingDiniyah: finalRank
    };
  });
}
