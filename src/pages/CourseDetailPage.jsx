import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../elements/AuthContext';
import { apiGetCourse, apiMarkWatched, apiUnmarkWatched, Mock } from '../api/api';
import Navbar from '../components/Navbar';
import {
  IconBook, IconClock, IconUser, IconBarChart,
  IconChevronLeft, IconChevronRight, IconPlay,
  IconCheckCircle, IconCircle,
} from '../elements/Icons';
import '../style/CourseDetail.css';

const LEVEL_CLASS = {
  Beginner: 'tag--beginner',
  Intermediate: 'tag--intermediate',
  Advanced: 'tag--advanced',
};

function formatTotal(videos) {
  const s = videos.reduce((sum, v) => {
    const [m, sec] = v.duration.split(':').map(Number);
    return sum + m * 60 + (sec || 0);
  }, 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}ч ${m}мин` : `${m} мин`;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null); 
  const { token, useMock } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = useMock ? Mock.getCourse(id) : await apiGetCourse(id);
      setCourse(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    load();
  }, [id, token]);

  const toggleWatch = async (video) => {
    if (toggling) return;
    setToggling(video.id);
    try {
      if (useMock) {
        video.is_watched ? Mock.unmarkWatched(video.id) : Mock.markWatched(video.id);
      } else {
        video.is_watched ? await apiUnmarkWatched(video.id) : await apiMarkWatched(video.id);
      }
      await load();
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <Navbar />
        <div className="course-detail">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 4 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="app">
        <Navbar />
        <div className="course-detail" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-4)' }}>
          Курс не найден
        </div>
      </div>
    );
  }

  const pct = course.lessons_count > 0
    ? Math.round((course.watched_count / course.lessons_count) * 100)
    : 0;
  const nextVideo = course.videos.find(v => !v.is_watched);
  const done = pct === 100;

  return (
    <div className="app">
      <Navbar />
      <div className="course-detail">

        {/* Breadcrumb */}
        <div className="breadcrumb fade-up">
          <Link to="/courses">
            <IconChevronLeft size={13} />
            Курсы
          </Link>
          <IconChevronRight size={12} className="breadcrumb__sep" />
          <span style={{ color: 'var(--text-2)' }}>{course.title}</span>
        </div>

        {/* Info card */}
        <div className="cd-info">
          <div className="cd-info__top">
            <div className="cd-info__left">
              <div className="cd-info__badges">
                <span className={`tag ${LEVEL_CLASS[course.level] || ''}`}>{course.level}</span>
                <span className="tag tag--category">{course.category}</span>
              </div>
              <h1 className="cd-info__title">{course.title}</h1>
              {course.subtitle && (
                <p className="cd-info__subtitle">{course.subtitle}</p>
              )}
              <p className="cd-info__desc">{course.description}</p>
              <div className="cd-info__meta">
                <div className="cd-info__meta-item"><IconBook size={13} />{course.lessons_count} уроков</div>
                <div className="cd-info__meta-item"><IconUser size={13} />{course.instructor_name}</div>
                <div className="cd-info__meta-item"><IconBarChart size={13} />{pct}% пройдено</div>
              </div>
            </div>

            <div className="cd-info__stats">
              <div className="cd-info__pct">{pct}%</div>
              <div className="cd-info__pct-sub">
                {course.watched_count} из {course.lessons_count}
              </div>
              <div className="cd-info__pct-bar">
                <div
                  className={`cd-info__pct-fill ${done ? 'cd-info__pct-fill--done' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {nextVideo ? (
                <button
                  className="btn-start"
                  onClick={() => navigate(`/course/${id}/watch/${nextVideo.id}`)}
                >
                  <IconPlay size={13} />
                  {course.watched_count === 0 ? 'Начать' : 'Продолжить'}
                </button>
              ) : (
                <div style={{
                  padding: '7px 0',
                  fontSize: 12,
                  color: 'var(--green)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}>
                  <IconCheckCircle size={13} />
                  Курс завершён!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lessons */}
        <div className="cd-lessons">
          <div className="cd-lessons__heading">Программа курса</div>
          <div className="cd-lessons__list">
            {course.videos.map((video, idx) => (
              <div
                key={video.id}
                className="lesson-row"
                onClick={() => navigate(`/course/${id}/watch/${video.id}`)}
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <span className="lesson-row__num">{idx + 1}</span>

                {/* Watch toggle checkbox */}
                <button
                  className={`lesson-row__check ${video.is_watched ? 'lesson-row__check--done' : ''}`}
                  onClick={e => { e.stopPropagation(); toggleWatch(video); }}
                  title={video.is_watched ? 'Снять отметку' : 'Отметить просмотренным'}
                  disabled={toggling === video.id}
                >
                  {video.is_watched
                    ? <IconCheckCircle size={11} className="lesson-row__check-icon" />
                    : null
                  }
                </button>

                <span className="lesson-row__play"><IconPlay size={11} /></span>

                <span className={`lesson-row__title ${video.is_watched ? 'lesson-row__title--watched' : ''}`}>
                  {video.title}
                </span>

                {video.description && (
                  <span style={{ fontSize: 11, color: 'var(--text-4)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {video.description}
                  </span>
                )}

                <span className="lesson-row__duration">
                  <IconClock size={11} />
                  {video.duration}
                </span>

                <IconChevronRight size={13} className="lesson-row__arrow" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
