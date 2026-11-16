import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SantriList from './components/SantriList';
import InputNilaiModal from './components/InputNilaiModal';
import PrintRaporModal from './components/PrintRaporModal';
import PrintKelasModal from './components/PrintKelasModal';
import LoginModal from './components/LoginModal';
import ManageUsersModal from './components/ManageUsersModal';
import SemesterModal from './components/SemesterModal';
import DiniyahSantriList from './components/DiniyahSantriList';
import InputDiniyahMapelModal from './components/InputDiniyahMapelModal';
import InputDiniyahSiswaModal from './components/InputDiniyahSiswaModal';
import PrintDiniyahModal from './components/PrintDiniyahModal';
import PrintKelasDiniyahModal from './components/PrintKelasDiniyahModal';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { 
  getAcademicPeriods, 
  getSantriWithGrades, 
  saveSantriRapor,
  getSantriWithDiniyahGrades,
  saveSantriDiniyah,
  saveBatchDiniyahPerMapel,
  setActiveAcademicPeriod,
  toggleSantriTahsin
} from './lib/supabase';
import initialSantriData from './data/initialSantri.json';

const USER_SESSION_KEY = 'pondok_erapot_auth_user';
const USER_SESSION_TIMESTAMP_KEY = 'pondok_erapot_auth_time';
const OFFLINE_QUEUE_KEY = 'pondok_erapot_offline_queue';
const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 Jam Tidak Aktif

export default function App() {
  // 1. Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_SESSION_KEY);
      const savedTime = localStorage.getItem(USER_SESSION_TIMESTAMP_KEY);
      if (!savedUser) return null;
      if (savedTime) {
        const elapsed = Date.now() - parseInt(savedTime, 10);
        if (elapsed > SESSION_TIMEOUT_MS) {
          localStorage.removeItem(USER_SESSION_KEY);
          localStorage.removeItem(USER_SESSION_TIMESTAMP_KEY);
          return null;
        }
      }
      return JSON.parse(savedUser);
    } catch (e) {
      return null;
    }
  });

  // Mode Modul Aktif: 'tahfidz' atau 'diniyah' (otomatis terkunci sesuai role guru)
  const [activeModule, setActiveModule] = useState(() => {
    return currentUser?.role === 'guru_diniyah' ? 'diniyah' : 'tahfidz';
  });

  // Sinkronkan activeModule jika user berubah
  useEffect(() => {
    if (currentUser?.role === 'guru_diniyah') {
      setActiveModule('diniyah');
    } else if (currentUser?.role === 'guru_tahfidz' || currentUser?.role === 'guru') {
      setActiveModule('tahfidz');
    }
  }, [currentUser]);

  // 2. Academic Periods & Santri State
  const [periods, setPeriods] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [diniyahSantriList, setDiniyahSantriList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // 3. Modals State (Tahfidz)
  const [inputSantri, setInputSantri] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [printKelasData, setPrintKelasData] = useState(null);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showAddSemester, setShowAddSemester] = useState(false);

  // 4. Modals State (Diniyah)
  const [inputDiniyahMapelKelas, setInputDiniyahMapelKelas] = useState(null); // string nama kelas
  const [inputDiniyahSiswa, setInputDiniyahSiswa] = useState(null); // objek santri
  const [printDiniyahData, setPrintDiniyahData] = useState(null); // { santri, ranking }
  const [printKelasDiniyahData, setPrintKelasDiniyahData] = useState(null); // { kelas }

  // 5. Offline Queue & Sync State
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [syncToast, setSyncToast] = useState(null); // { type: 'warning' | 'success', message: string }
  const [isSyncing, setIsSyncing] = useState(false);

  // Status apakah ada modal yang sedang terbuka
  const isAnyModalOpen = Boolean(
    inputSantri || 
    printData || 
    printKelasData || 
    showManageUsers || 
    showAddSemester ||
    inputDiniyahMapelKelas ||
    inputDiniyahSiswa ||
    printDiniyahData ||
    printKelasDiniyahData
  );

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
      setInputDiniyahMapelKelas(null);
      setInputDiniyahSiswa(null);
      setPrintDiniyahData(null);
      setPrintKelasDiniyahData(null);
    };

    // Saat user menekan tombol Escape di keyboard
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setInputSantri(null);
        setPrintData(null);
        setPrintKelasData(null);
        setShowManageUsers(false);
        setShowAddSemester(false);
        setInputDiniyahMapelKelas(null);
        setInputDiniyahSiswa(null);
        setPrintDiniyahData(null);
        setPrintKelasDiniyahData(null);
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

  // Sesi Otomatis Logout setelah 4 jam tidak aktif
  useEffect(() => {
    if (!currentUser) return;

    const recordActivity = () => {
      try {
        localStorage.setItem(USER_SESSION_TIMESTAMP_KEY, Date.now().toString());
      } catch (e) {}
    };

    // Update timestamp aktivitas saat pertama render / login
    recordActivity();

    // Throttled event listener (update timestamp paling sering setiap 30 detik saat ada interaksi)
    let lastRecorded = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastRecorded > 30000) {
        lastRecorded = now;
        recordActivity();
      }
    };

    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Cek berkala setiap 1 menit apakah waktu tidak aktif sudah melebihi 4 jam
    const intervalId = setInterval(() => {
      try {
        const savedTime = localStorage.getItem(USER_SESSION_TIMESTAMP_KEY);
        if (savedTime) {
          const elapsed = Date.now() - parseInt(savedTime, 10);
          if (elapsed > SESSION_TIMEOUT_MS) {
            alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 4 jam. Silakan login kembali.');
            setCurrentUser(null);
            localStorage.removeItem(USER_SESSION_KEY);
            localStorage.removeItem(USER_SESSION_TIMESTAMP_KEY);
          }
        }
      } catch (e) {}
    }, 60000);

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(intervalId);
    };
  }, [currentUser]);

  // Handle Login & Logout
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      localStorage.setItem(USER_SESSION_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {}
  };

  const handleLogout = () => {
    if (window.confirm('Keluar dari sistem E-Rapor?')) {
      setCurrentUser(null);
      try {
        localStorage.removeItem(USER_SESSION_KEY);
        localStorage.removeItem(USER_SESSION_TIMESTAMP_KEY);
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

  // Muat data santri (Tahfidz / Diniyah) setiap kali periode atau modul aktif berubah
  useEffect(() => {
    if (!currentUser || !currentPeriod) return;

    async function loadData() {
      setLoadingData(true);
      try {
        if (activeModule === 'diniyah') {
          const dData = await getSantriWithDiniyahGrades(currentPeriod.id);
          if (dData && dData.length > 0) {
            setDiniyahSantriList(dData);
          } else {
            setDiniyahSantriList(initialSantriData.map(s => ({ ...s, nilaiDiniyah: {}, catatanDiniyah: '' })));
          }
        } else {
          const tData = await getSantriWithGrades(currentPeriod.id);
          if (tData && tData.length > 0) {
            setSantriList(tData);
          } else {
            setSantriList(initialSantriData);
          }
        }
      } catch (err) {
        console.error('Gagal memuat data santri dari Supabase:', err);
        if (activeModule === 'diniyah') {
          setDiniyahSantriList(initialSantriData.map(s => ({ ...s, nilaiDiniyah: {}, catatanDiniyah: '' })));
        } else {
          setSantriList(initialSantriData);
        }
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [currentUser, currentPeriod, activeModule]);

  // Fungsi sinkronisasi antrean offline ke Supabase Cloud
  const syncOfflineQueue = useCallback(async () => {
    try {
      const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = saved ? JSON.parse(saved) : [];
      if (!queue.length) return;

      setIsSyncing(true);
      const remainingQueue = [];

      for (const item of queue) {
        try {
          await saveSantriRapor(
            item.periodId,
            item.santriId,
            item.nilaiJuz,
            item.catatan,
            item.jumlahHafalan,
            item.nilaiTahsin
          );
        } catch (err) {
          remainingQueue.push(item);
        }
      }

      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
      setOfflineQueue(remainingQueue);

      if (remainingQueue.length === 0) {
        setSyncToast({
          type: 'success',
          message: 'Semua nilai offline berhasil disinkronkan ke Cloud!'
        });
        setTimeout(() => setSyncToast(null), 4000);
      } else {
        setSyncToast({
          type: 'warning',
          message: `${remainingQueue.length} data masih menunggu koneksi stabil...`
        });
      }
    } catch (e) {
      console.error('Gagal memproses offline queue:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Pasang listener online otomatis saat internet tersambung kembali
  useEffect(() => {
    const handleOnline = () => {
      syncOfflineQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOfflineQueue]);

  // Handler simpan nilai, catatan, jumlah hafalan, dan nilai tahsin ke Supabase
  const handleSaveNilai = async (santriId, newNilaiJuz, newCatatan, newJumlahHafalan, newNilaiTahsin) => {
    // 1. Optimistic Update di UI lokal
    setSantriList(prev =>
      prev.map(s => {
        if (s.id === santriId) {
          return {
            ...s,
            nilaiJuz: newNilaiJuz,
            nilaiTahsin: newNilaiTahsin !== undefined ? newNilaiTahsin : s.nilaiTahsin,
            catatan: newCatatan !== undefined ? newCatatan : s.catatan,
            jumlahHafalan: newJumlahHafalan !== undefined ? newJumlahHafalan : s.jumlahHafalan
          };
        }
        return s;
      })
    );

    // 2. Simpan permanen ke Supabase Cloud atau masuk ke Offline Queue jika gagal/offline
    if (currentPeriod?.id && currentPeriod.id !== 'default') {
      try {
        await saveSantriRapor(
          currentPeriod.id,
          santriId,
          newNilaiJuz,
          newCatatan,
          newJumlahHafalan,
          newNilaiTahsin
        );

        // Jika berhasil, bersihkan item ini dari offline queue jika sebelumnya sempat gagal
        const currentSaved = localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (currentSaved) {
          const q = JSON.parse(currentSaved);
          const filtered = q.filter(item => !(item.periodId === currentPeriod.id && item.santriId === santriId));
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
          setOfflineQueue(filtered);
        }
      } catch (err) {
        console.warn('Jaringan offline/bermasalah, menyimpan ke Draft Offline Queue:', err);

        const draftItem = {
          periodId: currentPeriod.id,
          santriId,
          nilaiJuz: newNilaiJuz,
          catatan: newCatatan,
          jumlahHafalan: newJumlahHafalan,
          nilaiTahsin: newNilaiTahsin,
          timestamp: Date.now()
        };

        const currentSaved = localStorage.getItem(OFFLINE_QUEUE_KEY);
        const q = currentSaved ? JSON.parse(currentSaved) : [];
        const existingIdx = q.findIndex(i => i.periodId === currentPeriod.id && i.santriId === santriId);
        if (existingIdx >= 0) {
          q[existingIdx] = draftItem;
        } else {
          q.push(draftItem);
        }

        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
        setOfflineQueue(q);

        // Tampilkan toast badge notifikasi offline
        setSyncToast({
          type: 'warning',
          message: 'Nilai tersimpan lokal, akan disinkronkan saat online.'
        });
      }
    }
  };

  // Handler toggle program Tahsin oleh Admin
  const handleToggleTahsin = async (santriId, newStatus) => {
    // Optimistic Update
    setSantriList(prev => prev.map(s => s.id === santriId ? { ...s, is_tahsin: newStatus } : s));

    try {
      await toggleSantriTahsin(santriId, newStatus);
    } catch (err) {
      console.error('Gagal mengubah status Tahsin santri:', err);
      // Revert if error
      setSantriList(prev => prev.map(s => s.id === santriId ? { ...s, is_tahsin: !newStatus } : s));
      alert('Gagal memperbarui status Tahsin ke server. Periksa koneksi internet.');
    }
  };

  // Handler simpan nilai Diniyah per santriwati
  const handleSaveDiniyahSiswa = async (santriId, newNilaiMapel, newCatatan) => {
    // 1. Optimistic Update lokal
    setDiniyahSantriList(prev =>
      prev.map(s => {
        if (s.id === santriId) {
          return {
            ...s,
            nilaiDiniyah: newNilaiMapel,
            catatanDiniyah: newCatatan !== undefined ? newCatatan : s.catatanDiniyah
          };
        }
        return s;
      })
    );

    // 2. Simpan permanen ke Supabase Cloud
    if (currentPeriod?.id && currentPeriod.id !== 'default') {
      try {
        await saveSantriDiniyah(currentPeriod.id, santriId, newNilaiMapel, newCatatan);
      } catch (err) {
        console.error('Gagal simpan nilai diniyah ke Supabase:', err);
        alert('Gagal menyimpan nilai Diniyah ke Cloud. Periksa koneksi internet.');
      }
    }
  };

  // Handler simpan nilai Diniyah cepat massal per mapel sekelas (Ala Excel)
  const handleSaveBatchDiniyahMapel = async (kelas, mapelId, updates) => {
    // updates: [{ santriId, nilai }]
    // 1. Optimistic Update
    setDiniyahSantriList(prev =>
      prev.map(s => {
        const item = updates.find(u => u.santriId === s.id);
        if (item) {
          const currentMapel = { ...(s.nilaiDiniyah || {}) };
          if (item.nilai === '' || item.nilai === null || item.nilai === undefined) {
            delete currentMapel[mapelId];
          } else {
            currentMapel[mapelId] = Number(item.nilai);
          }
          return {
            ...s,
            nilaiDiniyah: currentMapel
          };
        }
        return s;
      })
    );

    // 2. Simpan permanen ke Supabase Cloud
    if (currentPeriod?.id && currentPeriod.id !== 'default') {
      await saveBatchDiniyahPerMapel(currentPeriod.id, mapelId, updates);
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
    const isDiniyah = activeModule === 'diniyah';
    const exportPayload = {
      modul: isDiniyah ? 'Diniyah' : 'Tahfidz',
      periode: currentPeriod,
      tanggalExport: new Date().toISOString(),
      santriList: isDiniyah ? diniyahSantriList : santriList
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Arsip_Rapor_${isDiniyah ? 'Diniyah' : 'Tahfidz'}_${periodLabel}.json`);
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
        activeModule={activeModule}
        onChangeModule={setActiveModule}
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
            <div style={{ fontSize: '1.05rem', fontWeight: '600' }}>
              Menyinkronkan data santri {activeModule === 'diniyah' ? 'Diniyah' : 'Tahfidz'} dari Cloud Supabase...
            </div>
          </div>
        ) : activeModule === 'diniyah' ? (
          <DiniyahSantriList
            santriList={diniyahSantriList}
            currentUser={currentUser}
            onOpenInputMapel={(kelas) => setInputDiniyahMapelKelas(kelas)}
            onSelectInputSiswa={(s) => setInputDiniyahSiswa(s)}
            onSelectPrintDiniyah={(s, rank) => setPrintDiniyahData({ santri: s, ranking: rank })}
            onSelectPrintClassDiniyah={(kelas) => setPrintKelasDiniyahData({ kelas })}
          />
        ) : (
          <SantriList
            santriList={santriList}
            currentUser={currentUser}
            onSelectInput={(s) => setInputSantri(s)}
            onSelectPrint={(s, rank) => setPrintData({ santri: s, ranking: rank })}
            onSelectPrintClass={(kelas) => setPrintKelasData({ kelas })}
            onToggleTahsin={handleToggleTahsin}
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

      {/* Modal Pratinjau & Cetak E-Rapor Format Asli Tahfidz */}
      {printData && (
        <PrintRaporModal
          santri={santriList.find(s => s.id === printData.santri.id) || printData.santri}
          ranking={printData.ranking}
          currentPeriod={currentPeriod}
          currentUser={currentUser}
          onClose={() => setPrintData(null)}
        />
      )}

      {/* Modal Cetak Per Kelas Tahfidz (Batch Rapor Santriwati & Rekap Nilai Leger) */}
      {printKelasData && (
        <PrintKelasModal
          santriList={santriList}
          initialKelas={printKelasData.kelas}
          currentPeriod={currentPeriod}
          onClose={() => setPrintKelasData(null)}
        />
      )}

      {/* Modal Input Cepat Diniyah Per Mapel (Ala Excel) */}
      {inputDiniyahMapelKelas && (
        <InputDiniyahMapelModal
          initialKelas={inputDiniyahMapelKelas}
          santriList={diniyahSantriList}
          onClose={() => setInputDiniyahMapelKelas(null)}
          onSaveBatch={handleSaveBatchDiniyahMapel}
        />
      )}

      {/* Modal Input Nilai Diniyah Per Santriwati */}
      {inputDiniyahSiswa && (
        <InputDiniyahSiswaModal
          santri={diniyahSantriList.find(s => s.id === inputDiniyahSiswa.id) || inputDiniyahSiswa}
          onClose={() => setInputDiniyahSiswa(null)}
          onSave={handleSaveDiniyahSiswa}
        />
      )}

      {/* Modal Cetak Lembar Rapor Diniyah A4 Formal (1 Santri) */}
      {printDiniyahData && (
        <PrintDiniyahModal
          santri={diniyahSantriList.find(s => s.id === printDiniyahData.santri.id) || printDiniyahData.santri}
          ranking={printDiniyahData.ranking}
          currentPeriod={currentPeriod}
          currentUser={currentUser}
          onClose={() => setPrintDiniyahData(null)}
        />
      )}

      {/* Modal Cetak Rapor Diniyah Per Kelas (Batch A4 & Leger Rekap) */}
      {printKelasDiniyahData && (
        <PrintKelasDiniyahModal
          santriList={diniyahSantriList}
          initialKelas={printKelasDiniyahData.kelas}
          currentPeriod={currentPeriod}
          onClose={() => setPrintKelasDiniyahData(null)}
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

      {/* Toast Notification Antrean Offline & Sinkronisasi */}
      {syncToast && (
        <div className={`offline-sync-toast ${syncToast.type}`}>
          {syncToast.type === 'warning' ? (
            <WifiOff size={18} style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          )}
          <span style={{ flex: 1 }}>{syncToast.message}</span>
          {offlineQueue.length > 0 && (
            <button
              type="button"
              className="offline-sync-toast-btn"
              onClick={syncOfflineQueue}
              disabled={isSyncing}
              title="Coba sinkronkan sekarang ke cloud"
            >
              {isSyncing ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={12} className="spin-icon" /> Menyinkronkan...
                </span>
              ) : (
                'Sinkronkan Sekarang'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
