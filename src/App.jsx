import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SantriList from './components/SantriList';
import InputNilaiModal from './components/InputNilaiModal';
import PrintRaporModal from './components/PrintRaporModal';
import PrintKelasModal from './components/PrintKelasModal';
import LoginModal from './components/LoginModal';
import ManageUsersModal from './components/ManageUsersModal';
import SemesterModal from './components/SemesterModal';
import { 
  getAcademicPeriods, 
  getSantriWithGrades, 
  saveSantriRapor,
  setActiveAcademicPeriod
} from './lib/supabase';
import initialSantriData from './data/initialSantri.json';

const USER_SESSION_KEY = 'pondok_erapot_auth_user';

export default function App() {
  // 1. Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_SESSION_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // 2. Academic Periods & Santri State
  const [periods, setPeriods] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // 3. Modals State
  const [inputSantri, setInputSantri] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [printKelasData, setPrintKelasData] = useState(null);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showAddSemester, setShowAddSemester] = useState(false);

  // Status apakah ada modal yang sedang terbuka
  const isAnyModalOpen = Boolean(inputSantri || printData || printKelasData || showManageUsers || showAddSemester);

  // Tangani tombol Back di browser/HP & tombol ESC keyboard untuk menutup modal
  useEffect(() => {
    if (!isAnyModalOpen) return;

    // Titipkan 1 history state ke browser
    window.history.pushState({ modalOpen: true }, '');
    let closedByPopstate = false;

    // Saat user memencet tombol Back di HP / browser
    const handlePopState = () => {
      closedByPopstate = true;
      setInputSantri(null);
      setPrintData(null);
      setPrintKelasData(null);
      setShowManageUsers(false);
      setShowAddSemester(false);
    };

    // Saat user menekan tombol Escape di keyboard
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setInputSantri(null);
        setPrintData(null);
        setPrintKelasData(null);
        setShowManageUsers(false);
        setShowAddSemester(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      // Jika modal ditutup BUKAN oleh tombol Back (misal klik tombol X atau Simpan),
      // hapus history state dummy agar riwayat browser tetap bersih
      if (!closedByPopstate) {
        window.history.back();
      }
    };
  }, [isAnyModalOpen]);

  // Handle Login & Logout
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } catch (e) {}
  };

  const handleLogout = () => {
    if (window.confirm('Keluar dari sistem E-Rapor?')) {
      setCurrentUser(null);
      try {
        localStorage.removeItem(USER_SESSION_KEY);
      } catch (e) {}
    }
  };

  // Muat daftar periode semester saat user login
  useEffect(() => {
    if (!currentUser) return;

    async function loadPeriods() {
      try {
        const periodList = await getAcademicPeriods();
        if (periodList && periodList.length > 0) {
          setPeriods(periodList);
          // Cari yang is_active = true, jika tidak ada pilih yang pertama
          const active = periodList.find(p => p.is_active) || periodList[0];
          setCurrentPeriod(active);
        } else {
          // Fallback periode default
          const defaultP = { id: 'default', tahun_ajaran: '2026/2027', semester: 'Ganjil', is_active: true };
          setPeriods([defaultP]);
          setCurrentPeriod(defaultP);
        }
      } catch (err) {
        console.error('Gagal mengambil periode:', err);
      }
    }

    loadPeriods();
  }, [currentUser]);

  // Muat data santri & nilai setiap kali periode berubah
  useEffect(() => {
    if (!currentUser || !currentPeriod) return;

    async function loadSantriData() {
      setLoadingData(true);
      try {
        const data = await getSantriWithGrades(currentPeriod.id);
        if (data && data.length > 0) {
          setSantriList(data);
        } else {
          // Jika di DB belum ada, pakai data initial
          setSantriList(initialSantriData);
        }
      } catch (err) {
        console.error('Gagal memuat data santri dari Supabase:', err);
        setSantriList(initialSantriData);
      } finally {
        setLoadingData(false);
      }
    }

    loadSantriData();
  }, [currentUser, currentPeriod]);

  // Handler simpan nilai, catatan, dan jumlah hafalan ke Supabase
  const handleSaveNilai = async (santriId, newNilaiJuz, newCatatan, newJumlahHafalan) => {
    // 1. Optimistic Update di UI lokal
    setSantriList(prev =>
      prev.map(s => {
        if (s.id === santriId) {
          return {
            ...s,
            nilaiJuz: newNilaiJuz,
            catatan: newCatatan !== undefined ? newCatatan : s.catatan,
            jumlahHafalan: newJumlahHafalan !== undefined ? newJumlahHafalan : s.jumlahHafalan
          };
        }
        return s;
      })
    );

    // 2. Simpan permanen ke Supabase Cloud
    if (currentPeriod?.id && currentPeriod.id !== 'default') {
      try {
        await saveSantriRapor(
          currentPeriod.id,
          santriId,
          newNilaiJuz,
          newCatatan,
          newJumlahHafalan
        );
      } catch (err) {
        console.error('Gagal menyimpan nilai ke Supabase:', err);
        alert('Peringatan: Nilai belum tersimpan ke Cloud Supabase. Periksa koneksi internet Anda.');
      }
    }
  };

  // Handler penambahan semester baru
  const handleSemesterCreated = (newPeriod) => {
    setPeriods(prev => [newPeriod, ...prev.map(p => ({ ...p, is_active: false }))]);
    setCurrentPeriod(newPeriod);
  };

  // Handler ganti periode aktif oleh Admin (guru otomatis mengikuti)
  const handleChangePeriod = async (selectedPeriod) => {
    setCurrentPeriod(selectedPeriod);
    if (currentUser?.role === 'admin' && selectedPeriod?.id && selectedPeriod.id !== 'default') {
      try {
        await setActiveAcademicPeriod(selectedPeriod.id);
        setPeriods(prev => prev.map(p => ({ ...p, is_active: p.id === selectedPeriod.id })));
      } catch (err) {
        console.error('Gagal update periode aktif di DB:', err);
      }
    }
  };

  // Handler ekspor file cadangan JSON semester aktif
  const handleExportSemester = () => {
    const periodLabel = `${currentPeriod?.tahun_ajaran || '2024-2025'}_Sem_${currentPeriod?.semester || 'Ganjil'}`.replace(/[\/\s]/g, '-');
    const exportPayload = {
      periode: currentPeriod,
      tanggalExport: new Date().toISOString(),
      santriList: santriList
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Arsip_Rapor_Tahfidz_${periodLabel}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Jika belum login, tampilkan layar login
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenManageUsers={() => setShowManageUsers(true)}
        periods={periods}
        currentPeriod={currentPeriod}
        onChangePeriod={handleChangePeriod}
        onOpenAddSemester={() => setShowAddSemester(true)}
        onExportSemester={handleExportSemester}
      />

      <main>
        {loadingData ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>⏳</div>
            <div style={{ fontSize: '1.05rem', fontWeight: '600' }}>Menyinkronkan data santri dari Cloud Supabase...</div>
          </div>
        ) : (
          <SantriList
            santriList={santriList}
            currentUser={currentUser}
            onSelectInput={(s) => setInputSantri(s)}
            onSelectPrint={(s, rank) => setPrintData({ santri: s, ranking: rank })}
            onSelectPrintClass={(kelas) => setPrintKelasData({ kelas })}
          />
        )}
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
          santri={santriList.find(s => s.id === printData.santri.id) || printData.santri}
          ranking={printData.ranking}
          currentPeriod={currentPeriod}
          currentUser={currentUser}
          onClose={() => setPrintData(null)}
        />
      )}

      {/* Modal Cetak Per Kelas (Batch Rapor Santriwati & Rekap Nilai Leger) */}
      {printKelasData && (
        <PrintKelasModal
          santriList={santriList}
          initialKelas={printKelasData.kelas}
          currentPeriod={currentPeriod}
          onClose={() => setPrintKelasData(null)}
        />
      )}

      {/* Modal Kelola Pengguna (Admin Saja) */}
      {showManageUsers && (
        <ManageUsersModal
          onClose={() => setShowManageUsers(false)}
        />
      )}

      {/* Modal Tambah Semester Baru (Admin Saja) */}
      {showAddSemester && (
        <SemesterModal
          onClose={() => setShowAddSemester(false)}
          onCreated={handleSemesterCreated}
        />
      )}
    </div>
  );
}
