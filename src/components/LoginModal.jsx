import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
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

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <img src="/logo.png" alt="Logo Pondok Pesantren" className="login-logo-img" />
          </div>
          <div className="login-arabic-fade" dir="rtl" aria-label="أَهْلًا وَسَهْلًا وَمَرْحَبًا بِكُمْ">
            أَهْلًا وَسَهْلًا وَمَرْحَبًا بِكُمْ
          </div>
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

        <div className="login-footer">
          <span>PPTQ JAMAL YUSUF AL-HADDAD • Terkoneksi Cloud Database</span>
        </div>
      </div>
    </div>
  );
}
