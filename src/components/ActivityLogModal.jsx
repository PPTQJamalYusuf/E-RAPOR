// ============================================================
// FILE   : src/components/ActivityLogModal.jsx
// TUJUAN : Modal pemantauan riwayat edit nilai (khusus Admin)
//          lengkap dengan filter modul, pencarian, diff lama→baru,
//          dan pagination ringan.
// CALLER : src/App.jsx
// DEPS   : src/lib/supabase.js (fetchActivityLogs), lucide-react
// EFEK   : Membaca data dari RPC get_activity_logs di Supabase
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  History,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  User
} from 'lucide-react';
import { fetchActivityLogs } from '../lib/supabase';

const PAGE_SIZE = 30;
const INLINE_DIFF_LIMIT = 4;

const MODULE_OPTIONS = [
  { id: 'all', label: 'Semua' },
  { id: 'tahfidz', label: 'Tahfidz' },
  { id: 'tahsin', label: 'Tahsin' },
  { id: 'diniyah', label: 'Diniyah' }
];

const MODULE_BADGE = {
  tahfidz: { label: 'Tahfidz', bg: '#dcfce7', text: '#166534', border: '#86efac' },
  tahsin: { label: 'Tahsin', bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
  diniyah: { label: 'Diniyah', bg: '#fef3c7', text: '#92400e', border: '#fcd34d' }
};

const ROLE_LABEL = {
  admin: 'Admin',
  guru_tahfidz: 'Guru Tahfidz',
  guru_diniyah: 'Guru Diniyah',
  guru: 'Guru Tahfidz'
};

function formatTimestamp(isoString) {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

function formatDiffValue(val) {
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
              <History size={22} />
            </div>
            <div>
              <h2 className="activity-log-title">Riwayat Aktivitas & Edit Nilai</h2>
              <p className="activity-log-subtitle">
                Audit otomatis setiap perubahan nilai Tahfidz, Tahsin, dan Diniyah (append-only)
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
            <X size={20} />
          </button>
        </div>

        {/* Toolbar Filter & Pencarian */}
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
              <Search size={15} className="activity-search-icon" />
              <input
                type="text"
                className="activity-search-input"
                placeholder="Cari santri, guru, atau mapel..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="activity-refresh-btn"
              onClick={() => loadLogs(0, false)}
              disabled={loading}
              title="Muat ulang riwayat"
            >
              <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>

        {/* Konten Timeline Log */}
        <div className="activity-log-body">
          {errorMsg && (
            <div className="login-error-banner" style={{ marginBottom: '14px' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="activity-empty-state">
              Memuat riwayat aktivitas dari Supabase...
            </div>
          ) : logs.length === 0 ? (
            <div className="activity-empty-state">
              Belum ada riwayat perubahan nilai yang sesuai filter.
            </div>
          ) : (
            <div className="activity-timeline-list">
              {logs.map((item) => {
                const badge = MODULE_BADGE[item.module] || MODULE_BADGE.tahfidz;
                const diffEntries = Object.entries(item.changes || {});
                const isLargeDiff = diffEntries.length > INLINE_DIFF_LIMIT;
                const isExpanded = Boolean(expandedIds[item.id]);
                const visibleDiffs = isLargeDiff && !isExpanded
                  ? diffEntries.slice(0, INLINE_DIFF_LIMIT)
                  : diffEntries;

                return (
                  <div key={item.id} className="activity-log-card">
                    <div className="activity-card-top">
                      <div className="activity-actor-row">
                        <span
                          className="activity-module-badge"
                          style={{
                            background: badge.bg,
                            color: badge.text,
                            borderColor: badge.border
                          }}
                        >
                          {badge.label}
                        </span>
                        <span className="activity-actor-name">
                          <User size={13} />
                          {item.actor_nama}
                        </span>
                        <span className="activity-role-tag">
                          {ROLE_LABEL[item.actor_role] || item.actor_role}
                        </span>
                      </div>
                      <span className="activity-time-label">
                        {formatTimestamp(item.created_at)}
                      </span>
                    </div>

                    <div className="activity-target-line">
                      <strong>{item.target_name}</strong>
                      <span className="activity-summary-sep">•</span>
                      <span className="activity-summary-text">{item.summary}</span>
                    </div>

                    {diffEntries.length > 0 && (
                      <div className="activity-diff-list">
                        {visibleDiffs.map(([field, vals]) => (
                          <div key={field} className="activity-diff-chip">
                            <span className="diff-field-name">{field}:</span>
                            <span className="diff-val-old">{formatDiffValue(vals?.old)}</span>
                            <ArrowRight size={12} className="diff-arrow-icon" />
                            <span className="diff-val-new">{formatDiffValue(vals?.new)}</span>
                          </div>
                        ))}

                        {isLargeDiff && (
                          <button
                            type="button"
                            className="activity-expand-btn"
                            onClick={() => toggleExpand(item.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={14} /> Sembunyikan rincian
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} /> Lihat {diffEntries.length - INLINE_DIFF_LIMIT} perubahan lainnya
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {hasMore && (
                <div style={{ textAlign: 'center', paddingTop: '8px' }}>
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
