import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../elements/AuthContext';
import { apiGetCourse, apiUpdateCourse, Mock } from '../api/api';
import { IconAlert, IconBook, IconChevronLeft, IconChevronRight } from '../elements/Icons';
import '../style/Admin.css';

export default function AdminCourseEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, useMock } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [course, setCourse] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');

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
        const data = useMock ? Mock.getCourse(id) : await apiGetCourse(id);
        if (!data) {
          setError('Курс не найден');
        } else {
          setCourse({
            ...data,
            videos: (data.videos || []).map(v => ({
              id: v.id,
              title: v.title || '',
              duration: v.duration || '00:00',
              description: v.description || '',
              video_url: v.video_url || '',
              content: v.content || '',
              is_watched: v.is_watched || false,
            })),
          });
        }
      } catch (e) {
        console.error(e);
        setError(e.message || 'Не удалось загрузить курс');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, user, useMock, id, navigate]);

  const handleCourseField = (field, value) => {
    setCourse(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVideoField = (index, field, value) => {
    setCourse(prev => {
      const nextVideos = [...(prev.videos || [])];
      nextVideos[index] = {
        ...nextVideos[index],
        [field]: value,
      };
      return { ...prev, videos: nextVideos };
    });
  };

  const handleAddVideo = () => {
    setCourse(prev => {
      const allCourses = Mock.getCourses();
      const allVideoIds = allCourses.flatMap(c => (c.videos || []).map(v => v.id));
      const nextId = allVideoIds.reduce((max, vid) => Math.max(max, vid || 0), 0) + 1;
      const nextVideos = [
        ...(prev.videos || []),
        {
          id: nextId,
          title: 'Новый урок',
          duration: '00:00',
          description: '',
          video_url: '',
          content: '',
          is_watched: false,
        },
      ];
      return { ...prev, videos: nextVideos };
    });
  };

  const handleRemoveVideo = (index) => {
    setCourse(prev => {
      const nextVideos = [...(prev.videos || [])];
      nextVideos.splice(index, 1);
      return { ...prev, videos: nextVideos };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!course) return;
    setSaving(true);
    setError('');
    try {
      if (useMock) {
        Mock.updateCourse(id, course);
      } else {
        await apiUpdateCourse(id, { ...course, admin_password: adminPassword });
      }
      navigate('/admin');
    } catch (e) {
      console.error(e);
      setError(e.message || 'Не удалось сохранить курс');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app">
      <Navbar />
      <div className="admin">
        <div className="admin-edit__header fade-up">
          <div className="admin-edit__breadcrumb">
            <Link to="/admin">
              <IconChevronLeft size={13} />
              Админка
            </Link>
            <IconChevronRight size={12} className="admin-edit__breadcrumb-sep" />
            <span>Редактирование курса</span>
          </div>
          <h1 className="admin__title">Редактирование курса</h1>
        </div>

        {error && (
          <div className="admin__error fade-up" style={{ marginTop: 10 }}>
            <IconAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="admin-edit__skeleton">
            <div className="skeleton" style={{ height: 26, width: '60%' }} />
            <div className="skeleton" style={{ height: 18, width: '80%', marginTop: 10 }} />
            <div className="skeleton" style={{ height: 160, width: '100%', marginTop: 18 }} />
          </div>
        ) : course && (
          <form className="admin-edit fade-up" onSubmit={handleSave}>
            <section className="admin-edit__main">
              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label className="admin-form__label">Название курса</label>
                  <input
                    className="admin-form__input"
                    type="text"
                    value={course.title}
                    onChange={e => handleCourseField('title', e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form__row">
                <div className="admin-form__field">
                  <label className="admin-form__label">Описание</label>
                  <textarea
                    className="admin-form__input admin-edit__textarea"
                    rows={3}
                    value={course.description || ''}
                    onChange={e => handleCourseField('description', e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form__row">
                <div className="admin-form__field admin-form__field--small">
                  <label className="admin-form__label">Уровень</label>
                  <select
                    className="admin-form__input admin-form__select"
                    value={course.level}
                    onChange={e => handleCourseField('level', e.target.value)}
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
                    value={course.category}
                    onChange={e => handleCourseField('category', e.target.value)}
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
                  <label className="admin-form__label">Преподаватель</label>
                  <input
                    className="admin-form__input"
                    type="text"
                    value={course.instructor_name || ''}
                    onChange={e => handleCourseField('instructor_name', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="admin-edit__videos">
              <div className="admin-edit__videos-header">
                <h2 className="admin__manage-title">
                  <IconBook size={14} /> Уроки курса
                </h2>
                <button
                  type="button"
                  className="admin-table__btn"
                  onClick={handleAddVideo}
                >
                  + Добавить урок
                </button>
              </div>

              {(course.videos || []).length === 0 ? (
                <div className="admin-edit__videos-empty">
                  В этом курсе пока нет уроков. Добавьте первый.
                </div>
              ) : (
                <div className="admin-edit__videos-list">
                  {course.videos.map((video, idx) => (
                    <div key={video.id} className="admin-edit__video-row">
                      <div className="admin-edit__video-num">{idx + 1}</div>
                      <div className="admin-edit__video-main">
                        <input
                          className="admin-form__input"
                          type="text"
                          value={video.title}
                          onChange={e => handleVideoField(idx, 'title', e.target.value)}
                          placeholder="Название урока"
                        />
                        <input
                          className="admin-form__input admin-edit__video-desc"
                          type="text"
                          value={video.description || ''}
                          onChange={e => handleVideoField(idx, 'description', e.target.value)}
                          placeholder="Краткое описание"
                        />
                        <input
                          className="admin-form__input admin-edit__video-url"
                          type="text"
                          value={video.video_url || ''}
                          onChange={e => handleVideoField(idx, 'video_url', e.target.value)}
                          placeholder="Ссылка на видео (mp4, HLS и т.п.)"
                        />
                        <textarea
                          className="admin-form__input admin-edit__video-content"
                          rows={2}
                          value={video.content || ''}
                          onChange={e => handleVideoField(idx, 'content', e.target.value)}
                          placeholder="Текст урока / конспект"
                        />
                      </div>
                      <div className="admin-edit__video-side">
                        <input
                          className="admin-form__input admin-edit__video-duration"
                          type="text"
                          value={video.duration}
                          onChange={e => handleVideoField(idx, 'duration', e.target.value)}
                          placeholder="мм:сс"
                        />
                        <button
                          type="button"
                          className="admin-table__btn admin-table__btn--danger"
                          onClick={() => handleRemoveVideo(idx)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="admin-edit__footer">
              {!useMock && (
                <div style={{ marginRight: 'auto', maxWidth: 260 }}>
                  <label className="admin-form__label">Подтверждение пароля администратора</label>
                  <input
                    className="admin-form__input"
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Пароль для сохранения изменений"
                  />
                </div>
              )}
              <button
                type="button"
                className="admin-form__submit admin-edit__btn-secondary"
                onClick={() => navigate('/admin')}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="admin-form__submit"
                disabled={saving}
              >
                {saving ? 'Сохраняем...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

