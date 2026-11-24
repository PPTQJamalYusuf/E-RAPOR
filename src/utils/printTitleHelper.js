import { useEffect } from 'react';

/**
 * Utilitas Sanitasi Nama File & Sinkronisasi Document Title untuk Cetak/Simpan PDF
 * Memastikan nama file default saat 'Save as PDF' di browser otomatis berformat:
 * [Nama Santri] - Rapor [Jenis] [Kelas]
 */

/**
 * Membersihkan karakter ilegal yang dilarang pada sistem file OS (Windows/Linux/Mac)
 * @param {string} str
 * @returns {string}
 */
export function sanitizeFileName(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\\/:*?"<>|]/g, '') // Hapus karakter terlarang di Windows
    .replace(/\s+/g, ' ')         // Normalisasi multiple spasi
    .trim();
}

/**
 * Hook untuk otomatis mengatur document.title saat modal cetak terbuka,
 * dan mengembalikannya ke judul asli saat modal ditutup.
 * @param {string} title
 */
export function usePrintDocumentTitle(title) {
  useEffect(() => {
    if (!title) return;
    const originalTitle = document.title;
    document.title = sanitizeFileName(title);

    return () => {
      document.title = originalTitle;
    };
  }, [title]);
}

/**
 * Menjalankan window.print() dengan memastikan document.title diset tepat sebelum dialog muncul,
 * dan otomatis di-restore ke judul asli setelah dialog cetak ditutup (afterprint).
 * @param {string} title
 */
export function executePrintWithTitle(title) {
  const originalTitle = document.title;
  if (title) {
    document.title = sanitizeFileName(title);
  }

  const handleAfterPrint = () => {
    window.removeEventListener('afterprint', handleAfterPrint);
    document.title = originalTitle;
  };

  window.addEventListener('afterprint', handleAfterPrint, { once: true });

  window.print();

  // Fallback pengaman jika browser tertentu tidak menembakkan event afterprint
  setTimeout(() => {
    if (document.title !== originalTitle) {
      document.title = originalTitle;
    }
  }, 2000);
}

/**
 * Menghitung skala zoom awal agar lembar A4 (lebar 210mm / ~794px)
 * tampil pas sempurna (fit-to-screen) di layar smartphone atau tablet.
 * @returns {number} Nilai skala (0.35 s/d 1.0)
 */
export function calculateFitZoom() {
  if (typeof window === 'undefined') return 1;
  const screenW = window.innerWidth;
  // Jika di mobile / tablet (< 850px), sesuaikan skala agar 210mm (~794px) pas di layar
  if (screenW < 850) {
    const targetDocWidth = 794; // Lebar standar kertas A4 (210mm) dalam piksel layar (96dpi)
    const availableWidth = screenW - 24; // Dikurangi sedikit margin sisi
    const rawScale = availableWidth / targetDocWidth;
    return Math.min(1, Math.max(0.35, +rawScale.toFixed(2)));
  }
  return 1;
}
