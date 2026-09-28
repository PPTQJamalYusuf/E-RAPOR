/**
 * Utility Perhitungan Nilai & Predikat E-Rapor Tahfidz
 * Menyesuaikan 100% rumus template Excel 'MASTER R.TAHFIDZ NEW.xlsx'
 * Dilengkapi dengan kamus dwibahasa (Arab - Indonesia)
 */

export const KELAS_BILINGUAL = {
  'الأول': 'Kelas 1 (الأول)',
  'الثاني': 'Kelas 2 (الثاني)',
  'الثالث': 'Kelas 3 (الثالث)',
  'الرابع': 'Kelas 4 (الرابع)',
  'الخامس': 'Kelas 5 (الخامس)',
  'السادس': 'Kelas 6 (السادس)'
};

export const SEMESTER_BILINGUAL = {
  'الأول': 'Ganjil (الأول)',
  'الاول': 'Ganjil (الأول)',
  'الثاني': 'Genap (الثاني)',
  'Ganjil': 'Ganjil (الأول)',
  'Genap': 'Genap (الثاني)',
  'ganjil': 'Ganjil (الأول)',
  'genap': 'Genap (الثاني)',
  '1': 'Ganjil (الأول)',
  '2': 'Genap (الثاني)'
};

export const PREDIKAT_COLORS = {
  'ممتاز': { bg: '#dcfce7', text: '#15803d', border: '#86efac', label: 'Mumtaz (Sangat Baik / ممتاز)' },
  'جيّد جدا': { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc', label: 'Jayyid Jiddan (Baik Sekali / جيّد جدا)' },
  'جيّد': { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', label: 'Jayyid (Baik / جيّد)' },
  'مقبول': { bg: '#fef9c3', text: '#854d0e', border: '#fde047', label: 'Maqbul (Cukup / مقبول)' },
  'راسب': { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5', label: 'Rasib (Mengulang / راسب)' },
  '-': { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1', label: 'Belum Diisi' }
};

export const PREDIKAT_LABEL_ID = {
  'ممتاز': 'Sangat Baik',
  'جيّد جدا': 'Baik Sekali',
  'جيّد': 'Baik',
  'مقبول': 'Cukup',
  'راسب': 'Mengulang'
};

export const JUZ_MATERI = {
  1: "Al-Fatihah s/d Al-Baqarah:141",
  2: "Al-Baqarah:142 s/d Al-Baqarah:252",
  3: "Al-Baqarah:253 s/d Ali 'Imran:92",
  4: "Ali 'Imran:93 s/d An-Nisa':23",
  5: "An-Nisa':24 s/d An-Nisa':147",
  6: "An-Nisa':148 s/d Al-Ma'idah:81",
  7: "Al-Ma'idah:82 s/d Al-An'am:110",
  8: "Al-An'am:111 s/d Al-A'raf:87",
  9: "Al-A'raf:88 s/d Al-Anfal:40",
  10: "Al-Anfal:41 s/d At-Taubah:92",
  11: "At-Taubah:93 s/d Hud:5",
  12: "Hud:6 s/d Yusuf:52",
  13: "Yusuf:53 s/d Ibrahim:52",
  14: "Al-Hijr:1 s/d An-Nahl:128",
  15: "Al-Isra':1 s/d Al-Kahf:74",
  16: "Al-Kahf:75 s/d Ta-Ha:135",
  17: "Al-Anbiya':1 s/d Al-Hajj:78",
  18: "Al-Mu'minun:1 s/d Al-Furqan:20",
  19: "Al-Furqan:21 s/d An-Naml:55",
  20: "An-Naml:56 s/d Al-'Ankabut:45",
  21: "Al-'Ankabut:46 s/d Al-Ahzab:30",
  22: "Al-Ahzab:31 s/d Yasin:27",
  23: "Yasin:28 s/d Az-Zumar:31",
  24: "Az-Zumar:32 s/d Fussilat:46",
  25: "Fussilat:47 s/d Al-Jasiyah:37",
  26: "Al-Ahqaf:1 s/d Az-Zariyat:30",
  27: "Az-Zariyat:31 s/d Al-Hadid:29",
  28: "Al-Mujadilah s/d At-Tahrim",
  29: "Al-Mulk s/d Al-Mursalat",
  30: "An-Naba' s/d An-Nas"
};

export const PREDIKAT_BILINGUAL = {
  'ممتاز': 'ممتاز - Sangat Baik',
  'جيّد جدا': 'جيّد جدا - Baik Sekali',
  'جيّد': 'جيّد - Baik',
  'مقبول': 'مقبول - Cukup',
  'راسب': 'راسب - Mengulang'
};

export function getPredikat(nilai) {
  if (nilai === null || nilai === undefined || nilai === '') return '';
  const num = Number(nilai);
  if (isNaN(num)) return '';
  const rounded = Math.round(num);
  if (rounded >= 95) return 'ممتاز';
  if (rounded >= 90) return 'جيّد جدا';
  if (rounded >= 85) return 'جيّد';
  if (rounded >= 80) return 'مقبول';
  return 'راسب';
}

export function hitungRapor(nilaiJuz = {}) {
  let total = 0;
  let count = 0;

  for (let juz = 1; juz <= 30; juz++) {
    const val = nilaiJuz[juz];
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (!isNaN(num) && num >= 0) {
        total += num;
        count++;
      }
    }
  }

  const rataRata = count > 0 ? Number((total / count).toFixed(2)) : 0;
  const predikatAkhir = count > 0 ? getPredikat(Math.round(rataRata)) : '-';

  return {
    total,
    count,
    rataRata,
    predikatAkhir
  };
}

/**
 * Hitung peringkat (ranking) untuk sekumpulan santri dalam satu kelas
 */
export function hitungRanking(santriList) {
  const scored = santriList.map(s => {
    const calc = hitungRapor(s.nilaiJuz || {});
    return {
      ...s,
      calc
    };
  });

  scored.sort((a, b) => {
    if (b.calc.rataRata !== a.calc.rataRata) {
      return b.calc.rataRata - a.calc.rataRata;
    }
    return b.calc.total - a.calc.total;
  });

  let currentRank = 1;
  return scored.map((item, index) => {
    if (index > 0) {
      const prev = scored[index - 1];
      if (prev.calc.rataRata !== item.calc.rataRata || prev.calc.total !== item.calc.total) {
        currentRank = index + 1;
      }
    }
    return {
      ...item,
      ranking: item.calc.count > 0 ? currentRank : '-'
    };
  });
}
