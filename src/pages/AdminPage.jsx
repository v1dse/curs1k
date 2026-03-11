import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../elements/AuthContext';
import { apiGetCourses, apiCreateCourse, apiDeleteCourse, Mock } from '../api/api';
import { IconBook, IconBarChart, IconUser, IconAlert } from '../elements/Icons';
import '../style/Admin.css';

export default function AdminPage() {
  const { token, useMock, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    subtitle: '',
    level: 'Beginner',
    category: 'Frontend',
    lessons_count: 0,
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      navigate('/courses');
      return;
    }

    const load = async () => {
      try {
        setError('');
        const data = useMock ? Mock.getCourses() : await apiGetCourses();
        setCourses(data);
      } catch (e) {
        console.error(e);
        setError(e.message || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, user, useMock, navigate]);

  const stats = useMemo(() => {
    if (!courses.length) {
      return {
        totalCourses: 0,
        totalLessons: 0,
        totalWatched: 0,
        globalPct: 0,
      };
    }
    const totalCourses = courses.length;
    const totalLessons = courses.reduce((s, c) => s + (c.lessons_count || 0), 0);
    const totalWatched = courses.reduce((s, c) => s + (c.watched_count || 0), 0);
    const globalPct = totalLessons > 0 ? Math.round((totalWatched / totalLessons) * 100) : 0;
    return { totalCourses, totalLessons, totalWatched, globalPct };
  }, [courses]);

  const topCourses = useMemo(() => {
    return [...courses]
      .sort((a, b) => (b.watched_count || 0) - (a.watched_count || 0))
      .slice(0, 5);
  }, [courses]);

  const handleFieldChange = (field, value) => {
    setNewCourse(prev => ({
      ...prev,
      [field]: field === 'lessons_count' ? Number(value) || 0 : value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCourse.title.trim()) return;
    setCreating(true);
    try {
      if (useMock) {
        Mock.createCourse(newCourse);
        const data = Mock.getCourses();
        setCourses(data);
      } else {
        await apiCreateCourse(newCourse);
        const data = await apiGetCourses();
        setCourses(data);
      }
      setNewCourse(prev => ({
        ...prev,
        title: '',
        description: '',
        subtitle: '',
        lessons_count: 0,
      }));
    } catch (e) {
      console.error(e);
      setError(e.message || 'Не удалось создать курс');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Удалить курс? Действие нельзя отменить.')) return;
    try {
      if (useMock) {
        Mock.deleteCourse(id);
        const data = Mock.getCourses();
        setCourses(data);
      } else {

        apiDeleteCourse(id);
        apiGetCourses().then(setCourses);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'Не удалось удалить курс');
    }
  };

  return (
    <div className="app">
      <Navbar />
      <div className="admin">
        <header className="admin__header fade-up">
          <div>
            <h1 className="admin__title">Админ-панель</h1>
            <p className="admin__subtitle">
              Управление обучающей платформой и мониторинг прогресса студентов
            </p>
          </div>
          {user && (
            <div className="admin__badge">
              <span className="admin__badge-label">Вы вошли как</span>
              <span className="admin__badge-user">
                <IconUser size={13} />
                {user.username} · {user.role}
              </span>
            </div>
          )}
        </header>

        <section className="admin__hint fade-up">
          <IconAlert size={14} />
          <div>
            <div className="admin__hint-title">Демо режим</div>
            <div className="admin__hint-text">
              Для входа в админку используйте аккаунт <strong>admin / admin123</strong>.
              В режиме MOCK данные курсов хранятся в localStorage.
            </div>
          </div>
        </section>

        <section className="admin__grid fade-up">
          <div className="admin-card admin-card--main">
            <div className="admin-card__header">
              <h2 className="admin-card__title">Общая статистика</h2>
              <span className="admin-card__tag">
                <IconBarChart size={13} />
                Сводка по платформе
              </span>
            </div>
            {loading ? (
              <div className="admin-card__skeleton">
                <div className="skeleton" style={{ height: 24, width: '40%' }} />
                <div className="skeleton" style={{ height: 10, width: '70%', marginTop: 16 }} />
                <div className="skeleton" style={{ height: 36, width: '85%', marginTop: 20 }} />
              </div>
            ) : (
              <>
                <div className="admin-stats">
                  <div className="admin-stat">
                    <div className="admin-stat__label">Курсов</div>
                    <div className="admin-stat__value">{stats.totalCourses}</div>
                  </div>
                  <div className="admin-stat">
                    <div className="admin-stat__label">Всего уроков</div>
                    <div className="admin-stat__value">{stats.totalLessons}</div>
                  </div>
                  <div className="admin-stat">
                    <div className="admin-stat__label">Просмотрено уроков</div>
                    <div className="admin-stat__value">{stats.totalWatched}</div>
                  </div>
                  <div className="admin-stat">
                    <div className="admin-stat__label">Средний прогресс</div>
                    <div className="admin-stat__value">{stats.globalPct}%</div>
                  </div>
                </div>

                <div className="admin-progress">
                  <div className="admin-progress__top">
                    <span className="admin-progress__label">Глобальный прогресс по всем курсам</span>
                    <span className="admin-progress__pct">{stats.globalPct}%</span>
                  </div>
                  <div className="admin-progress__bar">
                    <div
                      className="admin-progress__fill"
                      style={{ width: `${stats.globalPct}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="admin-card admin-card--side">
            <div className="admin-card__header">
              <h2 className="admin-card__title">Курсы</h2>
              <span className="admin-card__tag admin-card__tag--muted">
                <IconBook size={13} />
                Топ по прогрессу
              </span>
            </div>

            {loading ? (
              <div className="admin-list-skeleton">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 40, borderRadius: 8, marginBottom: 6 }}
                  />
                ))}
              </div>
            ) : topCourses.length === 0 ? (
              <div className="admin-empty">
                Нет курсов для отображения
              </div>
            ) : (
              <ul className="admin-list">
                {topCourses.map(course => {
                  const pct = course.lessons_count
                    ? Math.round((course.watched_count / course.lessons_count) * 100)
                    : 0;
                  return (
                    <li key={course.id} className="admin-list__item">
                      <div className="admin-list__main">
                        <div className="admin-list__title">{course.title}</div>
                        <div className="admin-list__meta">
                          <span>{course.lessons_count} уроков</span>
                          <span>·</span>
                          <span>{course.watched_count} просмотрено</span>
                        </div>
                      </div>
                      <div className="admin-list__progress">
                        <div className="admin-list__progress-bar">
                          <div
                            className="admin-list__progress-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="admin-list__progress-pct">{pct}%</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="admin__manage fade-up">
          <div className="admin__manage-header">
            <h2 className="admin__manage-title">Управление курсами</h2>
            {!useMock && (
              <span className="admin__manage-badge">
                Доступно только когда будет подключён backend API
              </span>
            )}
          </div>

          {useMock ? (
            <>
              <form className="admin-form" onSubmit={handleCreate}>
                <div className="admin-form__row">
                  <div className="admin-form__field">
                    <label className="admin-form__label">Название курса</label>
                    <input
                      className="admin-form__input"
                      type="text"
                      value={newCourse.title}
                      onChange={e => handleFieldChange('title', e.target.value)}
                      placeholder="Например, TypeScript для начинающих"
                    />
                  </div>
                  <div className="admin-form__field admin-form__field--small">
                    <label className="admin-form__label">Уровень</label>
                    <select
                      className="admin-form__input admin-form__select"
                      value={newCourse.level}
                      onChange={e => handleFieldChange('level', e.target.value)}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="admin-form__field admin-form__field--small">
                    <label className="admin-form__label">Категория</label>
                    <select
                      className="admin-form__input admin-form__select"
                      value={newCourse.category}
                      onChange={e => handleFieldChange('category', e.target.value)}
                    >
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Database">Database</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Tools">Tools</option>
                      <option value="CS Fundamentals">CS Fundamentals</option>
                    </select>
                  </div>
                  <div className="admin-form__field admin-form__field--small">
                    <label className="admin-form__label">Уроков</label>
                    <input
                      className="admin-form__input"
                      type="number"
                      min="0"
                      value={newCourse.lessons_count}
                      onChange={e => handleFieldChange('lessons_count', e.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-form__row">
                  <div className="admin-form__field">
                    <label className="admin-form__label">Краткое описание</label>
                    <input
                      className="admin-form__input"
                      type="text"
                      value={newCourse.description}
                      onChange={e => handleFieldChange('description', e.target.value)}
                      placeholder="Опишите, чему научится студент"
                    />
                  </div>
                  <div className="admin-form__actions">
                    <button
                      type="submit"
                      className="admin-form__submit"
                      disabled={creating || !newCourse.title.trim()}
                    >
                      {creating ? 'Создаём...' : 'Создать курс'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="admin-table">
                <div className="admin-table__head">
                  <span>Курс</span>
                  <span>Уроков</span>
                  <span>Просмотрено</span>
                  <span />
                </div>
                <div className="admin-table__body">
                  {courses.map(course => (
                    <div key={course.id} className="admin-table__row">
                      <div className="admin-table__cell admin-table__cell--title">
                        <div className="admin-table__course-title">{course.title}</div>
                        <div className="admin-table__course-meta">
                          {course.category} · {course.level}
                        </div>
                      </div>
                      <div className="admin-table__cell">{course.lessons_count}</div>
                      <div className="admin-table__cell">{course.watched_count}</div>
                      <div className="admin-table__cell admin-table__cell--actions">
                        <button
                          type="button"
                          className="admin-table__btn"
                          onClick={() => navigate(`/admin/course/${course.id}/edit`)}
                        >
                          Редактировать
                        </button>
                        <button
                          type="button"
                          className="admin-table__btn admin-table__btn--danger"
                          onClick={() => handleDelete(course.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="admin__manage-note">
              Администрирование курсов через API появится после подключения FastAPI backend.
            </div>
          )}
        </section>

        {error && (
          <div className="admin__error fade-up">
            <IconAlert size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

