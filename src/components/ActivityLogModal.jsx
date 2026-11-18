// ============================================================
// FILE   : src/components/ActivityLogModal.jsx
// TUJUAN : Modal pemantauan riwayat edit nilai (khusus Admin)
//          dengan tampilan line-text ringkas, filter, pencarian,
//          dan fitur hapus log (per baris / bersihkan semua).
// CALLER : src/App.jsx
// DEPS   : src/lib/supabase.js (fetchActivityLogs, deleteActivityLog,
//          clearActivityLogs), lucide-react
// EFEK   : Membaca & menghapus baris pada tabel activity_logs via RPC
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  History,
  Search,
  RefreshCw,
  AlertCircle,
  Trash2
} from 'lucide-react';
import {
  fetchActivityLogs,
  deleteActivityLog,
  clearActivityLogs
} from '../lib/supabase';

const PAGE_SIZE = 40;
const INLINE_PREVIEW_LIMIT = 3;

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
  const [deletingId, setDeletingId] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedIds, setExpandedIds] = useState({});

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

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Hapus 1 baris log dengan konfirmasi
  const handleDeleteOne = async (item) => {
    if (!isAdmin || !currentUser?.id) return;
    const confirmed = window.confirm(`Hapus riwayat "${item.target_name}" ini?`);
    if (!confirmed) return;

    setDeletingId(item.id);
    setErrorMsg('');
    try {
      await deleteActivityLog(currentUser.id, item.id);
      setLogs((prev) => prev.filter((row) => row.id !== item.id));
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus log.');
    } finally {
      setDeletingId(null);
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
                Catatan perubahan nilai Tahfidz, Tahsin, dan Diniyah
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

        {/* Daftar Line-Text Log */}
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
          ) : logs.length === 0 ? (
            <div className="activity-empty-state">
              Belum ada riwayat perubahan nilai.
            </div>
          ) : (
            <div className="activity-lines-wrap">
              {logs.map((item) => {
                const tag = MODULE_TAG[item.module] || MODULE_TAG.tahfidz;
                const diffEntries = Object.entries(item.changes || {});
                const hasMoreDiffs = diffEntries.length > INLINE_PREVIEW_LIMIT;
                const isExpanded = Boolean(expandedIds[item.id]);
                const inlineEntries = diffEntries.slice(0, INLINE_PREVIEW_LIMIT);

                return (
                  <div key={item.id} className="activity-line-item">
                    <div className="activity-line-row">
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
                        <span className="activity-line-sep">•</span>
                        <span className="activity-line-target">{item.target_name}</span>

                        {diffEntries.length > 0 ? (
                          <span className="activity-line-diffs">
                            <span className="activity-line-sep">—</span>
                            {inlineEntries.map(([field, vals], idx) => (
                              <span key={field} className="activity-inline-diff">
                                {idx > 0 && ', '}
                                <span className="diff-key">{field}:</span>{' '}
                                <span className="diff-old">{formatVal(vals?.old)}</span>
                                <span className="diff-arrow"> → </span>
                                <span className="diff-new">{formatVal(vals?.new)}</span>
                              </span>
                            ))}
                            {hasMoreDiffs && (
                              <button
                                type="button"
                                className="activity-inline-toggle"
                                onClick={() => toggleExpand(item.id)}
                              >
                                {isExpanded
                                  ? ' (tutup)'
                                  : ` (+${diffEntries.length - INLINE_PREVIEW_LIMIT} lainnya)`}
                              </button>
                            )}
                          </span>
                        ) : (
                          <span className="activity-line-diffs">
                            <span className="activity-line-sep">—</span>
                            {item.summary}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="activity-line-del-btn"
                        onClick={() => handleDeleteOne(item)}
                        disabled={deletingId === item.id}
                        title="Hapus baris log ini"
                        aria-label="Hapus baris log"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Rincian Tambahan (Khusus Batch / Perubahan > 3 item) */}
                    {hasMoreDiffs && isExpanded && (
                      <div className="activity-line-expanded">
                        {diffEntries.slice(INLINE_PREVIEW_LIMIT).map(([field, vals]) => (
                          <div key={field} className="activity-sub-line">
                            <span className="diff-key">{field}:</span>{' '}
                            <span className="diff-old">{formatVal(vals?.old)}</span>
                            <span className="diff-arrow"> → </span>
                            <span className="diff-new">{formatVal(vals?.new)}</span>
                          </div>
                        ))}
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
