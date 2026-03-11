import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../elements/AuthContext';
import { IconBook, IconGrid, IconBarChart, IconLogOut, IconShield } from '../elements/Icons';
import '../style/Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <NavLink to="/courses" className="navbar__logo">
        <div className="navbar__logo-icon">C1</div>
        <span className="navbar__logo-text">Cours1k</span>
      </NavLink>

      <div className="navbar__nav">
        <NavLink
          to="/courses"
          className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}
        >
          <IconGrid size={14} />
          Курсы
        </NavLink>
        <NavLink
          to="/progress"
          className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}
        >
          <IconBarChart size={14} />
          Прогресс
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => 'navbar__link' + (isActive ? ' active' : '')}
          >
            <IconShield size={14} />
            Админка
          </NavLink>
        )}
      </div>

      <div className="navbar__spacer" />

      {user && (
        <div className="navbar__user">
          <div className="navbar__avatar">
            {user.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="navbar__username">{user.username}</span>
          <button className="navbar__logout" onClick={handleLogout}>
            <IconLogOut size={13} />
            Выйти
          </button>
        </div>
      )}
    </nav>
  );
}
