import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../elements/AuthContext';
import { IconAlert, IconEye, IconEyeOff } from '../elements/Icons';
import '../style/Auth.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, token } = useAuth();

  useEffect(() => {
    if (token) navigate('/courses', { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/courses', { replace: true });
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__glow" />

      <div className="auth__card">
        <div className="auth__logo">
          <div className="auth__logo-icon">C1</div>
          <div className="auth__logo-name">Cours1k</div>
          <div className="auth__logo-sub">Платформа онлайн-обучения</div>
        </div>

        <div className="auth__box">
          {error && (
            <div className="auth__error">
              <IconAlert size={14} />
              {error}
            </div>
          )}

          <form className="auth__form" onSubmit={handleSubmit}>
            <div className="auth__field">
              <label className="auth__label">Логин</label>
              <input
                className="auth__input"
                type="text"
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="auth__field">
              <label className="auth__label">Пароль</label>
              <div className="auth__input-wrap">
                <input
                  className="auth__input auth__input--pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth__eye"
                  onClick={() => setShowPass(v => !v)}
                >
                  {showPass ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth__submit"
              disabled={loading || !username || !password}
            >
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Входим...</>
                : 'Войти'}
            </button>
          </form>
        </div>


      </div>
    </div>
  );
}
