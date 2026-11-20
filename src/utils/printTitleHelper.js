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
