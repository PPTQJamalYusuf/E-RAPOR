import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle, Sparkles } from 'lucide-react';
import { authenticateUser } from '../lib/supabase';

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Harap isi username dan password!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authenticateUser(username, password);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'Login gagal.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <img src="/logo.png" alt="Logo Pondok Pesantren" className="login-logo-img" />
          </div>
          <div className="login-arabic">كشف درجات تحفيظ القرآن</div>
          <h2 className="login-title">E-Rapor Tahfidz Pondok</h2>
          <p className="login-subtitle">Masuk untuk mengelola dan menginput nilai santriwati</p>
        </div>

        {errorMsg && (
          <div className="login-error-banner">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: admin atau guru1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="form-control"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block login-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <LogIn size={18} /> Masuk ke Sistem
              </>
            )}
          </button>
        </form>

        <div className="login-quick-demo">
          <div className="quick-demo-title">
            <Sparkles size={14} /> Akun Tersedia untuk Uji Coba:
          </div>
          <div className="quick-demo-buttons">
            <button
              type="button"
              className="quick-btn admin"
              onClick={() => handleQuickFill('admin', 'admin123')}
            >
              👑 Login Admin (admin / admin123)
            </button>
            <button
              type="button"
              className="quick-btn guru"
              onClick={() => handleQuickFill('guru1', 'guru123')}
            >
              👩‍🏫 Login Guru Kelas 1 (guru1 / guru123)
            </button>
          </div>
        </div>

        <div className="login-footer">
          <span>Kulliyyatul Mu'allimat Al-Islamiyyah • Terkoneksi Cloud Database</span>
        </div>
      </div>
    </div>
  );
}
