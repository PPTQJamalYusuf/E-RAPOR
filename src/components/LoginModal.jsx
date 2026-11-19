import React, { useState, useEffect } from 'react';
import { Lock, User, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authenticateUser } from '../lib/supabase';

// Karakter utuh berharakat tersusun rapi untuk animasi typing
const ARABIC_AHLAN_CHARS = [
  'أَ', 'هْ', 'لً', 'ا', ' ', 
  'وَ', 'سَ', 'هْ', 'لً', 'ا', ' ', 
  'وَ', 'مَ', 'رْ', 'حَ', 'بً', 'ا', ' ', 
  'بِ', 'كُ', 'مْ'
];
const FULL_ARABIC_TEXT = ARABIC_AHLAN_CHARS.join('');

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Animasi Typing Tulisan Arab (Tempo lebih lambat dan tenang)
  const [typedArabic, setTypedArabic] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    // Jeda 300ms saat halaman baru dibuka sebelum mulai mengetik
    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        currentIndex++;
        setTypedArabic(ARABIC_AHLAN_CHARS.slice(0, currentIndex).join(''));

        if (currentIndex >= ARABIC_AHLAN_CHARS.length) {
          clearInterval(interval);
          setTypingComplete(true);
        }
      }, 150); // 150ms per huruf (lebih santai dan elegan)

      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(startTimer);
  }, []);

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
          <div className="login-arabic" dir="rtl" aria-label={FULL_ARABIC_TEXT}>
            <span>{typedArabic}</span>
            <span 
              className="login-typing-cursor"
              style={{ opacity: typingComplete ? 0.35 : 1 }}
            />
          </div>
          <h2 className="login-title">E-Rapor Tahfidz</h2>
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
                type={showPassword ? 'text' : 'password'}
                className="form-control has-toggle"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(prev => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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

      {/* Subtle Craftsman Monogram (Quiet Signature) */}
      <div 
        className="login-craftsman-monogram" 
        title="Dibuat dengan ketulusan oleh Bagas Irfa'i"
      >
        v1.0 • crafted by bagas irfa'i
      </div>
    </div>
  );
}
