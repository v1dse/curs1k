import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../elements/AuthContext';
import { apiGetCourses, Mock } from '../api/api';
import Navbar from '../components/Navbar';
import { IconBook, IconCheckCircle, IconTrophy, IconZap, IconBarChart } from '../elements/Icons';
import '../style/Progress.css';

export default function ProgressPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, useMock } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const load = async () => {
      try {
        const data = useMock ? Mock.getCourses() : await apiGetCourses();
        setCourses(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const totalLessons   = courses.reduce((s, c) => s + c.lessons_count, 0);
  const totalWatched   = courses.reduce((s, c) => s + c.watched_count, 0);
  const completedCourses = courses.filter(c => c.watched_count === c.lessons_count && c.lessons_count > 0).length;
  const inProgress     = courses.filter(c => c.watched_count > 0 && c.watched_count < c.lessons_count).length;
  const globalPct      = totalLessons > 0 ? Math.round((totalWatched / totalLessons) * 100) : 0;

  const stats = [
    { icon: <IconBarChart size={16} />, iconClass: 'stat-card__icon--purple', value: `${globalPct}%`, label: 'Общий прогресс' },
    { icon: <IconCheckCircle size={16} />, iconClass: 'stat-card__icon--green',  value: totalWatched,      label: 'Уроков просмотрено' },
    { icon: <IconTrophy size={16} />,      iconClass: 'stat-card__icon--amber',  value: completedCourses, label: 'Курсов завершено' },
    { icon: <IconZap size={16} />,         iconClass: 'stat-card__icon--blue',   value: inProgress,       label: 'В процессе' },
  ];

  return (
    <div className="app">
      <Navbar />
      <div className="progress-page">
        <div className="progress-page__header fade-up">
          <h1 className="progress-page__title">Мой прогресс</h1>
          <p className="progress-page__sub">
            Отслеживай прохождение каждого курса урок за уроком
          </p>
        </div>

        {/* Stats */}
        <div className="stats-strip">
          {stats.map((s, i) => (
            <div key={i} className="stat-card" style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
              <div className={`stat-card__icon ${s.iconClass}`}>{s.icon}</div>
              <div className="stat-card__value">{loading ? '—' : s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per-course progress */}
        <div className="prog-list">
          <div className="prog-list__heading">Курсы</div>

          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12, marginBottom: 8 }} />
              ))
            : courses.map((course, ci) => {
                const pct = course.lessons_count > 0
                  ? Math.round((course.watched_count / course.lessons_count) * 100)
                  : 0;
                const done = pct === 100;

                return (
                  <Link
                    to={`/course/${course.id}`}
                    key={course.id}
                    className="prog-item"
                    style={{ animation: `fadeUp 0.3s ease ${ci * 0.05}s both` }}
                  >
                    <div className="prog-item__top">
                      <div className="prog-item__title">{course.title}</div>
                      <div className="prog-item__right">
                        {done ? (
                          <div className="prog-item__complete">
                            <IconCheckCircle size={11} />
                            Завершён
                          </div>
                        ) : (
                          <>
                            <span className="prog-item__pct">{pct}%</span>
                            <span className="prog-item__count">
                              {course.watched_count}/{course.lessons_count}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Segmented bar — one block per lesson */}
                    <div className="prog-item__segments">
                      {course.videos
                        ? course.videos.map((v, vi) => (
                            <div
                              key={v.id}
                              className={`prog-segment ${v.is_watched ? 'prog-segment--done' : ''}`}
                              title={`${vi + 1}. ${v.title} — ${v.is_watched ? 'просмотрено' : 'не просмотрено'}`}
                            />
                          ))
                        : Array.from({ length: course.lessons_count }).map((_, vi) => (
                            <div
                              key={vi}
                              className={`prog-segment ${vi < course.watched_count ? 'prog-segment--done' : ''}`}
                            />
                          ))
                      }
                    </div>
                  </Link>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}
