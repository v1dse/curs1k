import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../elements/AuthContext';
import { apiGetCourses, Mock } from '../api/api';
import Navbar from '../components/Navbar';
import {
  IconBook, IconSearch, IconChevronRight,
  IconGlobe, IconZap, IconDatabase, IconTerminal, IconGit, IconCode,
} from '../elements/Icons';
import '../style/Courses.css';

const CATEGORY_ICONS = {
  Frontend:       <IconGlobe size={11} />,
  Backend:        <IconZap size={11} />,
  Database:       <IconDatabase size={11} />,
  DevOps:         <IconTerminal size={11} />,
  Tools:          <IconGit size={11} />,
  'CS Fundamentals': <IconCode size={11} />,
};

const LEVEL_CLASS = {
  Beginner:     'tag--beginner',
  Intermediate: 'tag--intermediate',
  Advanced:     'tag--advanced',
};

function CourseCard({ course }) {
  const navigate = useNavigate();
  const pct = course.lessons_count > 0
    ? Math.round((course.watched_count / course.lessons_count) * 100)
    : 0;
  const started = course.watched_count > 0;
  const done = pct === 100;
  const subtitle = course.subtitle || '';

  return (
    <div className="course-card" onClick={() => navigate(`/course/${course.id}`)}>
      {/* Progress strip at very top */}
      <div
        className="course-card__strip"
        style={{ width: `${pct}%` }}
      />

      <div className="course-card__tags">
        <span className="tag tag--category">
          {CATEGORY_ICONS[course.category]}
          {course.category}
        </span>
        <span className={`tag ${LEVEL_CLASS[course.level] || ''}`}>
          {course.level}
        </span>
      </div>

      <h3 className="course-card__title">{course.title}</h3>
      {subtitle && <p className="course-card__subtitle">{subtitle}</p>}
      <p className="course-card__desc">{course.description}</p>

      <div className="course-card__meta">
        <div className="course-card__meta-item">
          <IconBook size={12} />
          {course.lessons_count} уроков
        </div>
        <div className="course-card__meta-item" style={{ color: 'var(--text-4)' }}>·</div>
        <div className="course-card__meta-item">{course.instructor_name}</div>
        {done && (
          <div className="course-card__done-badge" style={{ marginLeft: 'auto' }}>
            ✓ Завершён
          </div>
        )}
      </div>

      {started && (
        <div className="course-card__progress">
          <div className="course-card__progress-top">
            <span className="course-card__progress-label">Прогресс</span>
            <span className="course-card__progress-pct">{pct}%</span>
          </div>
          <div className="course-card__bar">
            <div
              className={`course-card__bar-fill ${done ? 'course-card__bar-fill--done' : 'course-card__bar-fill--active'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="course-card__cta">
        <span className="course-card__cta-text">
          {!started ? 'Начать курс' : done ? 'Пересмотреть' : 'Продолжить'}
        </span>
        <IconChevronRight size={14} className="course-card__cta-arrow" />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="course-card-skeleton">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: 22, width: 80 }} />
        <div className="skeleton" style={{ height: 22, width: 70 }} />
      </div>
      <div className="skeleton" style={{ height: 18, width: '80%' }} />
      <div>
        <div className="skeleton" style={{ height: 14, width: '100%', marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '65%' }} />
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 10 }}>
        <div className="skeleton" style={{ height: 14, width: 70 }} />
        <div className="skeleton" style={{ height: 14, width: 90 }} />
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const { token, useMock } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = useMock ? Mock.getCourses() : await apiGetCourses();
      setCourses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    load();
  }, [token]);

  const categories = [...new Set(courses.map(c => c.category))];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    const mQ = !q
      || c.title.toLowerCase().includes(q)
      || (c.subtitle || '').toLowerCase().includes(q)
      || c.description.toLowerCase().includes(q);
    const mL = filterLevel === 'all' || c.level === filterLevel;
    const mC = filterCat === 'all' || c.category === filterCat;
    return mQ && mL && mC;
  });

  const totalWatched = courses.reduce((s, c) => s + c.watched_count, 0);
  const totalLessons = courses.reduce((s, c) => s + c.lessons_count, 0);
  const globalPct = totalLessons > 0 ? Math.round((totalWatched / totalLessons) * 100) : 0;

  return (
    <div className="app">
      <Navbar />
      <div className="courses">
        {/* Header */}
        <div className="courses__header fade-up">
          <div>
            <h1 className="courses__title">Курсы</h1>
            <p className="courses__subtitle">
              {courses.length} курсов · {totalWatched} из {totalLessons} уроков просмотрено
            </p>
          </div>
          {totalLessons > 0 && (
            <div className="courses__global-progress">
              <div className="courses__global-bar">
                <div
                  className="courses__global-fill"
                  style={{ width: `${globalPct}%` }}
                />
              </div>
              <span className="courses__global-pct">{globalPct}%</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="courses__filters">
          <div className="courses__search-wrap">
            <IconSearch size={14} className="courses__search-icon" />
            <input
              className="courses__search"
              type="text"
              placeholder="Поиск курсов..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="courses__filter-group">
            {['all', ...levels].map(l => (
              <button
                key={l}
                className={`courses__filter-btn ${filterLevel === l ? 'active' : ''}`}
                onClick={() => setFilterLevel(l)}
              >
                {l === 'all' ? 'Все' : l}
              </button>
            ))}
          </div>

          <div className="courses__filter-group">
            {['all', ...categories].map(c => (
              <button
                key={c}
                className={`courses__filter-btn ${filterCat === c ? 'active' : ''}`}
                onClick={() => setFilterCat(c)}
              >
                {c === 'all' ? 'Все категории' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="courses__grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
              ? (
                <div className="courses__empty">
                  <IconBook size={36} />
                  <p>Курсы не найдены</p>
                </div>
              )
              : filtered.map((course, i) => (
                <div key={course.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                  <CourseCard course={course} />
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
