import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SantriList from './components/SantriList';
import InputNilaiModal from './components/InputNilaiModal';
import PrintRaporModal from './components/PrintRaporModal';
import initialSantriData from './data/initialSantri.json';

const STORAGE_KEY = 'pondok_erapot_tahfidz_data_v3';

export default function App() {
  const [santriList, setSantriList] = useState(() => {
    try {
      const savedV3 = localStorage.getItem(STORAGE_KEY);
      if (savedV3) {
        return JSON.parse(savedV3);
      }
      // Ambil nilai yang pernah diinput dari storage lama (v2/v1) dan pasangkan ke nama Proper Case baru
      const savedOld = localStorage.getItem('pondok_erapot_tahfidz_data_v2') || localStorage.getItem('pondok_erapot_tahfidz_data_v1');
      if (savedOld) {
        const parsedOld = JSON.parse(savedOld);
        const gradesMap = {};
        parsedOld.forEach(s => {
          if (s.nilaiJuz && Object.keys(s.nilaiJuz).length > 0) {
            const k = s.nis || s.id || s.nama.trim().toUpperCase();
            gradesMap[k] = { nilaiJuz: s.nilaiJuz, catatan: s.catatan };
            gradesMap[s.nama.trim().toUpperCase()] = gradesMap[k];
          }
        });
        return initialSantriData.map(s => {
          const old = gradesMap[s.nis] || gradesMap[s.id] || gradesMap[s.nama.trim().toUpperCase()];
          if (old) {
            return {
              ...s,
              nilaiJuz: old.nilaiJuz,
              catatan: old.catatan || s.catatan
            };
          }
          return s;
        });
      }
    } catch (e) {
      console.error('Gagal membaca data dari LocalStorage:', e);
    }
    return initialSantriData;
  });

  const [inputSantri, setInputSantri] = useState(null);
  const [printData, setPrintData] = useState(null);

  // Simpan otomatis ke LocalStorage setiap ada update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(santriList));
    } catch (e) {
      console.error('Gagal menyimpan data ke LocalStorage:', e);
    }
  }, [santriList]);

  // Handler simpan nilai dan catatan dari modal input
  const handleSaveNilai = (santriId, newNilaiJuz, newCatatan) => {
    setSantriList(prev =>
      prev.map(s => {
        if (s.id === santriId) {
          return {
            ...s,
            nilaiJuz: newNilaiJuz,
            catatan: newCatatan !== undefined ? newCatatan : s.catatan
          };
        }
        return s;
      })
    );
  };

  // Handler ekspor file cadangan JSON
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(santriList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cadangan_erapot_tahfidz_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handler reset ke data bawaan Excel
  const handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset seluruh data kembali ke data master Excel asli? Semua nilai yang baru dimasukkan akan terhapus.')) {
      setSantriList(initialSantriData);
      localStorage.removeItem(STORAGE_KEY);
      alert('Data berhasil direset ke master Excel.');
    }
  };

  return (
    <div className="app-container">
      <Header
        onExport={handleExportBackup}
        onReset={handleResetData}
        santriCount={santriList.length}
      />

      <main>
        <SantriList
          santriList={santriList}
          onSelectInput={(s) => setInputSantri(s)}
          onSelectPrint={(s, rank) => setPrintData({ santri: s, ranking: rank })}
        />
      </main>

      {/* Modal Input Nilai Tahfidz 30 Juz */}
      {inputSantri && (
        <InputNilaiModal
          santri={inputSantri}
          onClose={() => setInputSantri(null)}
          onSave={handleSaveNilai}
        />
      )}

      {/* Modal Pratinjau & Cetak E-Rapor Format Asli */}
      {printData && (
        <PrintRaporModal
          santri={printData.santri}
          ranking={printData.ranking}
          onClose={() => setPrintData(null)}
        />
      )}
    </div>
  );
}
