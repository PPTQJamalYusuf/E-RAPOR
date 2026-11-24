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

/**
 * Format tampilan nama kelas: 'Kelas 1' s/d 'Kelas 6', dan 'Alumni' untuk alumni
 */
export const formatNamaKelas = (k) => {
  if (!k || k === 'Semua') return 'Semua Kelas';
  const clean = String(k).trim();
  if (clean.toLowerCase() === 'alumni') return 'Alumni';
  const map = {
    'الأول': 'Kelas 1',
    'الاول': 'Kelas 1',
    '1': 'Kelas 1',
    'Kelas 1': 'Kelas 1',
    'الثاني': 'Kelas 2',
    '2': 'Kelas 2',
    'Kelas 2': 'Kelas 2',
    'الثالث': 'Kelas 3',
    '3': 'Kelas 3',
    'Kelas 3': 'Kelas 3',
    'الرابع': 'Kelas 4',
    '4': 'Kelas 4',
    'Kelas 4': 'Kelas 4',
    'الخامس': 'Kelas 5',
    '5': 'Kelas 5',
    'Kelas 5': 'Kelas 5',
    'السادس': 'Kelas 6',
    '6': 'Kelas 6',
    'Kelas 6': 'Kelas 6'
  };
  return map[clean] || (clean.startsWith('Kelas') ? clean : `Kelas ${clean}`);
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
 * 7 Kriteria Penilaian Rapor Tahsin Al-Qur'an (Sesuai Master Excel Pondok)
 */
export const KRITERIA_TAHSIN = [
  { id: 'makharij', labelAr: 'مخارج الحروف', labelId: 'Makharijul Huruf' },
  { id: 'mad', labelAr: 'مدّ', labelId: 'Mad' },
  { id: 'ghunnah', labelAr: 'غنة', labelId: 'Ghunnah' },
  { id: 'idzhar', labelAr: 'إظهار', labelId: 'Idzhar' },
  { id: 'idgham', labelAr: 'إدغام', labelId: 'Idgham' },
  { id: 'ikhfa', labelAr: 'إخفاء', labelId: "Ikhfa'" },
  { id: 'harakat', labelAr: 'حركات', labelId: 'Harakat' }
];

/**
 * Hitung kalkulasi nilai Tahsin (Total, Rata-rata, Predikat Akhir, & Predikat per Aspek)
 */
export function hitungRaporTahsin(nilaiTahsin = {}) {
  let total = 0;
  let count = 0;
  const details = {};

  KRITERIA_TAHSIN.forEach(k => {
    const val = nilaiTahsin?.[k.id];
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (!isNaN(num)) {
        total += num;
        count += 1;
        details[k.id] = {
          nilai: num,
          predikat: getPredikat(num)
        };
      }
    }
  });

  const rataRata = count > 0 ? Number((total / count).toFixed(2)) : 0;
  const predikatAkhir = count > 0 ? getPredikat(Math.round(rataRata)) : '-';

  return {
    total,
    count,
    rataRata,
    predikatAkhir,
    details
  };
}

/**
 * Hitung peringkat (ranking) untuk sekumpulan santri dalam satu kelas.
 * - Peringkat (ranking) hanya dihitung untuk santriwati program reguler Tahfidz yang memiliki nilai juz.
 * - Santriwati program Tahsin mendapat ranking '-' agar tidak berebut peringkat juz.
 * - Urutan nama santriwati tetap dipertahankan sesuai abjad (A-Z) dan santri Tahsin tidak turun ke bawah.
 */
export function hitungRanking(santriList) {
  const scored = santriList.map(s => {
    const calc = hitungRapor(s.nilaiJuz || {});
    const calcTahsin = s.is_tahsin ? hitungRaporTahsin(s.nilaiTahsin || {}) : null;
    return {
      ...s,
      calc,
      calcTahsin
    };
  });

  // Hitung ranking khusus santri Tahfidz murni yang sudah memiliki nilai juz
  const tahfidzScored = scored.filter(s => !s.is_tahsin && s.calc && s.calc.count > 0);
  tahfidzScored.sort((a, b) => {
    if (b.calc.rataRata !== a.calc.rataRata) {
      return b.calc.rataRata - a.calc.rataRata;
    }
    return b.calc.total - a.calc.total;
  });

  const rankMap = new Map();
  let currentRank = 1;
  tahfidzScored.forEach((item, index) => {
    if (index > 0) {
      const prev = tahfidzScored[index - 1];
      if (prev.calc.rataRata !== item.calc.rataRata || prev.calc.total !== item.calc.total) {
        currentRank = index + 1;
      }
    }
    rankMap.set(item.id, currentRank);
  });

  // Pasangkan ranking ke seluruh santri (Tahsin & belum dinilai = '-')
  const withRanking = scored.map(item => ({
    ...item,
    ranking: rankMap.has(item.id) ? rankMap.get(item.id) : '-'
  }));

  // Urutan nama tetap berdasarkan abjad (A-Z) agar santri Tahsin tidak turun ke bawah
  return withRanking.sort((a, b) => {
    return (a.nama || '').localeCompare(b.nama || '', 'id', { sensitivity: 'base' });
  });
}

/**
 * Template Catatan Evaluasi Otomatis Resmi Rapor Tahfidz Al-Qur'an
 */
export const CATATAN_OTOMATIS_TAHFIDZ = {
  'ممتاز': "Alhamdulillah, Ananda menunjukkan hafalan yang lancar, kuat dan bacaan baik. Pertahankan kualitas hafalan serta tingkatkan murojaah agar semakin mutqin. Semoga Al-Qur'an menjadi cahaya hati dan pedoman hidup Ananda.\nبَارَكَ اللهُ فِيكِ، وَنَفَعَكِ بِالْقُرْآنِ، وَجَعَلَكِ مِنْ أَهْلِهِ وَخَاصَّتِهِ.",
  'جيّد جدا': "Alhamdulillah, Ananda menunjukkan perkembangan hafalan yang baik. Tingkatkan ketelitian, kelancaran dan ketepatan bacaan dengan memperbanyak murojaah. Semoga Allah memberkahi dan memudahkan Ananda menjaga Kalam-Nya.\nبَارَكَ اللهُ فِيكِ، وَنَفَعَكِ بِالْقُرْآنِ، وَجَعَلَكِ مِنْ أَهْلِهِ وَخَاصَّتِهِ.",
  'جيّد': "Ananda telah menunjukkan usaha hafalan yang baik. Namun kelancaran dan kekuatan perlu ditingkatkan. Rajinlah murojaah dan perbaiki bacaan yang keliru. Semoga Allah memberi kekuatan dan istiqamah menghafal Al-Qur'an.\nبَارَكَ اللهُ فِيكِ، وَنَفَعَكِ بِالْقُرْآنِ، وَجَعَلَكِ مِنْ أَهْلِهِ وَخَاصَّتِهِ.",
  'مقبول': "Ananda telah mencapai standar ketuntasan, namun kesungguhan dan kualitas perlu ditingkatkan. Biasakan murojaah rutin dan perbaiki bacaan yang belum tepat. Semoga Allah memberi kemudahan dan semangat menjaga hafalan.\nبَارَكَ اللهُ فِيكِ، وَنَفَعَكِ بِالْقُرْآنِ، وَجَعَلَكِ مِنْ أَهْلِهِ وَخَاصَّتِهِ.",
  'راسب': "Ananda perlu meningkatkan kesungguhan dan ketekunan menghafal. Perbanyak murojaah, benahi hafalan bersama ustadzah. Jangan berkecil hati, jadikan motivasi. Semoga Allah beri kemudahan dan kekuatan bersama Al-Qur'an.\nبَارَكَ اللهُ فِيكِ، وَنَفَعَكِ بِالْقُرْآنِ، وَجَعَلَكِ مِنْ أَهْلِهِ وَخَاصَّتِهِ."
};

// Aliases tanpa tasydid/shaddah
CATATAN_OTOMATIS_TAHFIDZ['جيد جدا'] = CATATAN_OTOMATIS_TAHFIDZ['جيّد جدا'];
CATATAN_OTOMATIS_TAHFIDZ['جيد'] = CATATAN_OTOMATIS_TAHFIDZ['جيّد'];

/**
 * Template Catatan Evaluasi Otomatis Resmi Rapor Tahsin Al-Qur'an
 */
export const CATATAN_OTOMATIS_TAHSIN = {
  'ممتاز': "Alhamdulillah, Ananda menunjukkan bacaan Al-Qur'an yang sangat baik, tartil, fasih, serta penguasaan makharijul huruf dan tajwid yang tepat. Pertahankan kelancaran dan adab tilawah. Semoga Al-Qur'an menjadi cahaya hati dan pedoman hidup Ananda.\nبَارَكَ اللهُ فِيكِ، وَنَفَعَكِ بِالْقُرْآنِ، وَجَعَلَكِ مِنْ أَهْلِهِ وَخَاصَّتِهِ.",
  'جيّد جدا': "Alhamdulillah, Ananda menunjukkan perkembangan bacaan tahsin yang baik. Tingkatkan ketelitian pada hukum tajwid dan kelancaran makhraj huruf dengan memperbanyak latihan tilawah. Semoga Allah memberkahi dan memudahkan Ananda menjaga Kalam-Nya.\nبَارَكَ اللهُ فِيكِ، وَنَفَعَكِ بِالْقُرْآنِ، وَجَعَلَكِ مِنْ أَهْلِهِ وَخَاصَّتِهِ.",
  'جيّد': "Ananda telah menunjukkan usaha perbaikan bacaan yang baik. Namun ketepatan makharijul huruf dan hukum tajwid perlu ditingkatkan. Rajinlah berlatih talaqqi dan perbaiki bacaan yang keliru. Semoga Allah memberi kekuatan dan istiqamah bersama Al-Qur'an.\nبَارَكَ اللهُ فِيكِ، وَنَفَعَكِ بِالْقُرْآنِ، وَجَعَلَكِ مِنْ أَهْلِهِ وَخَاصَّتِهِ.",
  'مقبول': "Ananda telah mencapai standar ketuntasan tahsin, namun kefasihan makhraj dan ketepatan hukum mad serta harakat perlu ditingkatkan. Biasakan tilawah rutin dan terus menyimak ustadzah. Semoga Allah memberi kemudahan dan semangat memperbagus bacaan Al-Qur'an.\nبَارَكَ اللهُ فِيكِ، وَنَفَعَكِ بِالْقُرْآنِ، وَجَعَلَكِ مِنْ أَهْلِهِ وَخَاصَّتِهِ.",
  'راسب': "Ananda perlu meningkatkan kesungguhan dan ketekunan dalam memperbaiki bacaan Al-Qur'an. Perbanyak latihan dasar makhraj dan harakat bersama ustadzah. Jangan berkecil hati, jadikan motivasi. Semoga Allah beri kemudahan dan kekuatan bersama Al-Qur'an.\nبَارَكَ اللهُ فِيكِ، وَنَفَعَكِ بِالْقُرْآنِ، وَجَعَلَكِ مِنْ أَهْلِهِ وَخَاصَّتِهِ."
};

// Aliases tanpa tasydid/shaddah
CATATAN_OTOMATIS_TAHSIN['جيد جدا'] = CATATAN_OTOMATIS_TAHSIN['جيّد جدا'];
CATATAN_OTOMATIS_TAHSIN['جيد'] = CATATAN_OTOMATIS_TAHSIN['جيّد'];

/**
 * Mengambil catatan evaluasi Tahfidz (memprioritaskan catatan khusus manual guru jika ada)
 */
export function getCatatanTahfidz(predikat, customCatatan) {
  if (customCatatan && typeof customCatatan === 'string' && customCatatan.trim() !== '') {
    return customCatatan.trim();
  }
  return CATATAN_OTOMATIS_TAHFIDZ[predikat] || '';
}

/**
 * Mengambil catatan evaluasi Tahsin (memprioritaskan catatan khusus manual guru jika ada)
 */
export function getCatatanTahsin(predikat, customCatatan) {
  if (customCatatan && typeof customCatatan === 'string' && customCatatan.trim() !== '') {
    return customCatatan.trim();
  }
  return CATATAN_OTOMATIS_TAHSIN[predikat] || '';
}

/**
 * Memisahkan teks evaluasi Bahasa Indonesia dan doa berbahasa Arab
 * agar doa Arab dapat dirender rapi rata kanan (RTL).
 * Menggunakan regex fleksibel untuk mencocokkan blok doa Arab di bagian akhir teks
 * baik dengan/tanpa baris baru (\n), tanda baca Arab/Latin, maupun perbedaan harakat.
 */
export function parseCatatan(rawCatatan) {
  if (!rawCatatan || typeof rawCatatan !== 'string') {
    return { text: '', doa: '' };
  }
  const str = rawCatatan.trim();
  const match = str.match(/([\u0600-\u06FF][\u0600-\u06FF\s،,.\u060C\u061B\u061F-]*)$/);
  if (match) {
    const doa = match[1].trim();
    const text = str.slice(0, match.index).trim();
    if (doa.length >= 5) {
      return { text, doa };
    }
  }
  return { text: str, doa: '' };
}
