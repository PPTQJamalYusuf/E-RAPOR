// ============================================================
// FILE   : src/components/ActivityLogModal.jsx
// TUJUAN : Modal pemantauan riwayat edit nilai (khusus Admin)
//          yang mengelompokkan log per santri/target (1 nama = 1 baris),
//          dapat diklik untuk melihat seluruh rincian perubahan, serta
//          mendukung hapus per baris, per santri, atau semua log.
// CALLER : src/App.jsx
// DEPS   : src/lib/supabase.js (fetchActivityLogs, deleteActivityLog,
//          clearActivityLogs), lucide-react
// EFEK   : Membaca & menghapus baris pada tabel activity_logs via RPC
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  History,
  Search,
  RefreshCw,
  AlertCircle,
  Trash2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import {
  fetchActivityLogs,
  deleteActivityLog,
  clearActivityLogs
} from '../lib/supabase';

const PAGE_SIZE = 100;

const MODULE_OPTIONS = [
  { id: 'all', label: 'Semua' },
  { id: 'tahfidz', label: 'Tahfidz' },
  { id: 'tahsin', label: 'Tahsin' },
  { id: 'diniyah', label: 'Diniyah' }
];

const MODULE_TAG = {
  tahfidz: { label: 'TAHFIDZ', color: '#166534', bg: '#dcfce7' },
  tahsin: { label: 'TAHSIN', color: '#0369a1', bg: '#e0f2fe' },
  diniyah: { label: 'DINIYAH', color: '#92400e', bg: '#fef3c7' }
};

function formatCompactTime(isoString) {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

function formatVal(val) {
  if (val === null || val === undefined || val === '') return 'kosong';
  if (typeof val === 'boolean') return val ? 'Aktif' : 'Nonaktif';
  return String(val);
}

export default function ActivityLogModal({ currentUser, onClose }) {
  const [logs, setLogs] = useState([]);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  const isAdmin = currentUser?.role === 'admin';

  // Debounce pencarian agar tidak menembak Supabase di setiap ketikan huruf
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadLogs = useCallback(async (offsetVal = 0, append = false) => {
    if (!isAdmin || !currentUser?.id) return;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setErrorMsg('');

    try {
      const rows = await fetchActivityLogs({
        adminId: currentUser.id,
        module: moduleFilter,
        search: debouncedSearch,
        limit: PAGE_SIZE,
        offset: offsetVal
      });

      if (append) {
        setLogs((prev) => [...prev, ...rows]);
      } else {
        setLogs(rows);
      }
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat riwayat aktivitas.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isAdmin, currentUser?.id, moduleFilter, debouncedSearch]);

  useEffect(() => {
    loadLogs(0, false);
  }, [loadLogs]);

  // Kelompokkan log berdasarkan santri/target agar 1 nama hanya tampil 1 baris
  // Urutan otomatis mengikuti aktivitas terbaru di paling atas
  const groupedLogs = useMemo(() => {
    const map = new Map();

    logs.forEach((item) => {
      const groupKey = item.target_id || item.target_name || item.id;
      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          targetName: item.target_name,
          latestAt: item.created_at,
          latestActor: item.actor_nama,
          modules: [],
          items: []
        });
      }

      const group = map.get(groupKey);
      group.items.push(item);
      if (item.module && !group.modules.includes(item.module)) {
        group.modules.push(item.module);
      }
    });

    return Array.from(map.values());
  }, [logs]);

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Hapus 1 baris log di dalam grup santri
  const handleDeleteOne = async (item) => {
    if (!isAdmin || !currentUser?.id) return;
    const confirmed = window.confirm(
      `Hapus 1 catatan perubahan (${formatCompactTime(item.created_at)}) milik "${item.target_name}"?`
    );
    if (!confirmed) return;

    setDeletingKey(item.id);
    setErrorMsg('');
    try {
      await deleteActivityLog(currentUser.id, item.id);
      setLogs((prev) => prev.filter((row) => row.id !== item.id));
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus log.');
    } finally {
      setDeletingKey(null);
    }
  };

  // Hapus seluruh log yang tergabung dalam 1 santri/target
  const handleDeleteGroup = async (e, group) => {
    e.stopPropagation();
    if (!isAdmin || !currentUser?.id || !group.items.length) return;

    const confirmed = window.confirm(
      `Hapus semua (${group.items.length}) riwayat log milik "${group.targetName}"?`
    );
    if (!confirmed) return;

    setDeletingKey(group.key);
    setErrorMsg('');
    try {
      const idsToDelete = group.items.map((i) => i.id);
      await Promise.all(idsToDelete.map((id) => deleteActivityLog(currentUser.id, id)));
      const idSet = new Set(idsToDelete);
      setLogs((prev) => prev.filter((row) => !idSet.has(row.id)));
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus riwayat santri tersebut.');
    } finally {
      setDeletingKey(null);
    }
  };

  // Bersihkan seluruh log (atau sesuai filter modul yang aktif)
  const handleClearLogs = async () => {
    if (!isAdmin || !currentUser?.id || logs.length === 0) return;

    const scopeLabel =
      moduleFilter === 'all'
        ? 'SEMUA riwayat log aktivitas'
        : `seluruh riwayat log modul ${moduleFilter.toUpperCase()}`;

    const confirmed = window.confirm(
      `Yakin ingin menghapus ${scopeLabel}? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setClearing(true);
    setErrorMsg('');
    try {
      await clearActivityLogs(currentUser.id, moduleFilter);
      setLogs([]);
      setHasMore(false);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membersihkan riwayat log.');
    } finally {
      setClearing(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content activity-log-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="activity-log-header">
          <div className="activity-log-title-wrap">
            <div className="activity-log-icon-box">
              <History size={20} />
            </div>
            <div>
              <h2 className="activity-log-title">Riwayat Aktivitas Nilai</h2>
              <p className="activity-log-subtitle">
                Dikelompokkan per santri — klik nama untuk melihat rincian perubahan
              </p>
            </div>
          </div>
          <button
            type="button"
            className="activity-log-close-btn"
            onClick={onClose}
            aria-label="Tutup"
            title="Tutup (ESC)"
          >
            <X size={19} />
          </button>
        </div>

        {/* Toolbar Filter, Pencarian, & Hapus Log */}
        <div className="activity-log-toolbar">
          <div className="activity-log-pills" role="tablist">
            {MODULE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={moduleFilter === opt.id}
                className={`activity-filter-pill ${moduleFilter === opt.id ? 'active' : ''}`}
                onClick={() => setModuleFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="activity-log-search-group">
            <div className="activity-search-box">
              <Search size={14} className="activity-search-icon" />
              <input
                type="text"
                className="activity-search-input"
                placeholder="Cari santri, guru, mapel..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="activity-refresh-btn"
              onClick={() => loadLogs(0, false)}
              disabled={loading}
              title="Muat ulang"
            >
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            </button>

            <button
              type="button"
              className="activity-clear-btn"
              onClick={handleClearLogs}
              disabled={clearing || loading || logs.length === 0}
              title={
                moduleFilter === 'all'
                  ? 'Hapus semua riwayat log'
                  : `Hapus semua log ${moduleFilter}`
              }
            >
              <Trash2 size={14} />
              <span>{clearing ? 'Menghapus...' : 'Hapus Log'}</span>
            </button>
          </div>
        </div>

        {/* Daftar Grup per Santri (Klik untuk Expand Rincian) */}
        <div className="activity-log-body">
          {errorMsg && (
            <div className="login-error-banner" style={{ margin: '12px 18px' }}>
              <AlertCircle size={17} />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="activity-empty-state">
              Memuat riwayat aktivitas...
            </div>
          ) : groupedLogs.length === 0 ? (
            <div className="activity-empty-state">
              Belum ada riwayat perubahan nilai.
            </div>
          ) : (
            <div className="activity-lines-wrap">
              {groupedLogs.map((group) => {
                const isExpanded = Boolean(expandedGroups[group.key]);

                return (
                  <div
                    key={group.key}
                    className={`activity-group-item ${isExpanded ? 'is-expanded' : ''}`}
                  >
                    {/* Baris Utama 1 Santri = 1 Baris */}
                    <div
                      className="activity-group-row"
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => toggleGroup(group.key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleGroup(group.key);
                        }
                      }}
                    >
                      <span className="activity-group-chevron">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>

                      <span className="activity-group-name">{group.targetName}</span>

                      <span className="activity-group-tags">
                        {group.modules.map((mod) => {
                          const tag = MODULE_TAG[mod] || MODULE_TAG.tahfidz;
                          return (
                            <span
                              key={mod}
                              className="activity-line-tag"
                              style={{ background: tag.bg, color: tag.color }}
                            >
                              {tag.label}
                            </span>
                          );
                        })}
                      </span>

                      <span className="activity-group-count">
                        {group.items.length}x ubah
                      </span>

                      <span className="activity-group-meta">
                        {formatCompactTime(group.latestAt)} • {group.latestActor}
                      </span>

                      <button
                        type="button"
                        className="activity-line-del-btn"
                        onClick={(e) => handleDeleteGroup(e, group)}
                        disabled={deletingKey === group.key}
                        title={`Hapus semua (${group.items.length}) log milik ${group.targetName}`}
                        aria-label={`Hapus semua log ${group.targetName}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Rincian Semua Perubahan Santri Tersebut Saat Diklik */}
                    {isExpanded && (
                      <div className="activity-group-details">
                        {group.items.map((item) => {
                          const tag = MODULE_TAG[item.module] || MODULE_TAG.tahfidz;
                          const diffEntries = Object.entries(item.changes || {});

                          return (
                            <div key={item.id} className="activity-detail-line">
                              <span className="activity-line-time">
                                {formatCompactTime(item.created_at)}
                              </span>

                              <span
                                className="activity-line-tag"
                                style={{ background: tag.bg, color: tag.color }}
                              >
                                {tag.label}
                              </span>

                              <div className="activity-line-content">
                                <strong className="activity-line-actor">{item.actor_nama}</strong>
                                <span className="activity-line-sep">—</span>
                                {diffEntries.length > 0 ? (
                                  <span className="activity-line-diffs">
                                    {diffEntries.map(([field, vals], idx) => (
                                      <span key={field} className="activity-inline-diff">
                                        {idx > 0 && ', '}
                                        <span className="diff-key">{field}:</span>{' '}
                                        <span className="diff-old">{formatVal(vals?.old)}</span>
                                        <span className="diff-arrow"> → </span>
                                        <span className="diff-new">{formatVal(vals?.new)}</span>
                                      </span>
                                    ))}
                                  </span>
                                ) : (
                                  <span className="activity-line-diffs">{item.summary}</span>
                                )}
                              </div>

                              <button
                                type="button"
                                className="activity-line-del-btn"
                                onClick={() => handleDeleteOne(item)}
                                disabled={deletingKey === item.id}
                                title="Hapus catatan ini saja"
                                aria-label="Hapus catatan ini"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {hasMore && (
                <div className="activity-load-more-wrap">
                  <button
                    type="button"
                    className="activity-load-more-btn"
                    onClick={() => loadLogs(logs.length, true)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
