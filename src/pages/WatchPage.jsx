import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../elements/AuthContext';
import { apiGetCourse, apiMarkWatched, apiUnmarkWatched, Mock } from '../api/api';
import Navbar from '../components/Navbar';
import {
  IconPlay, IconPause, IconVolume2, IconVolumeX,
  IconMaximize, IconMinimize, IconSkipBack, IconSkipForward,
  IconChevronLeft, IconChevronRight, IconClock, IconBook,
  IconCheckCircle, IconCircle,
} from '../elements/Icons';
import '../style/Watch.css';

// VIDEO PLAYER 

function VideoPlayer({ videoUrl, title, onEnded }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCtrl, setShowCtrl] = useState(true);

  const isYouTube = videoUrl && /youtube\.com|youtu\.be/.test(videoUrl);

  const getYouTubeId = (url) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return u.pathname.replace('/', '');
      }
      if (u.hostname.includes('youtube.com')) {
        return u.searchParams.get('v') || '';
      }
    } catch {
      // Недействительный URL, возможно, используется необработанный идентификатор.
      return url;
    }
    return '';
  };

  const showControls = useCallback(() => {
    setShowCtrl(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowCtrl(false);
    }, 3000);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    v.paused ? v.play() : v.pause();
    showControls();
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setProgress(v.currentTime);
    if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
    showControls();
  };

  const skip = (sec) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
    showControls();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const handleVolChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
    setMuted(val === 0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="player"
      onMouseMove={showControls}
      onClick={isYouTube ? undefined : togglePlay}
    >
      {videoUrl ? (
        isYouTube ? (
          <iframe
            className="player__video player__video-embed"
            src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="player__video"
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onPlay={() => setPlaying(true)}
            onPause={() => { setPlaying(false); setShowCtrl(true); }}
            onEnded={() => { setPlaying(false); setShowCtrl(true); onEnded?.(); }}
          />
        )
      ) : (
        <div className="player__placeholder">
          <div className="player__placeholder-icon">
            <IconPlay size={22} />
          </div>
          <p className="player__placeholder-text">
            Видео загрузится после подключения бэкенда
          </p>
        </div>
      )}

      {/* Controls overlay (только для обычного видео, не YouTube) */}
      {!isYouTube && (
        <>
          <div
            className={`player__overlay ${showCtrl ? 'player__overlay--visible' : 'player__overlay--hidden'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="player__gradient" />
            <div className="player__controls">
              <div className="player__title-bar">{title}</div>

              {/* Seek bar */}
              <div className="player__seek" onClick={handleSeek}>
                <div className="player__seek-track">
                  <div className="player__seek-buf" style={{ width: `${bufPct}%` }} />
                  <div className="player__seek-fill" style={{ width: `${pct}%` }}>
                    <div className="player__seek-thumb" />
                  </div>
                </div>
              </div>

              {/* Buttons row */}
              <div className="player__row">
                <button className="player__btn player__btn--lg" onClick={togglePlay}>
                  {playing ? <IconPause size={17} /> : <IconPlay size={17} />}
                </button>
                <button className="player__btn" onClick={() => skip(-10)}>
                  <IconSkipBack size={14} />
                </button>
                <button className="player__btn" onClick={() => skip(10)}>
                  <IconSkipForward size={14} />
                </button>
                <span className="player__time">{fmt(progress)} / {fmt(duration)}</span>

                <div className="player__spacer" />

                <button className="player__btn" onClick={toggleMute}>
                  {muted || volume === 0 ? <IconVolumeX size={14} /> : <IconVolume2 size={14} />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={muted ? 0 : volume}
                  onChange={handleVolChange}
                  className="player__vol"
                  onClick={e => e.stopPropagation()}
                />
                <button className="player__btn" onClick={toggleFullscreen}>
                  {fullscreen ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Big center play button */}
          {!playing && showCtrl && (
            <div className="player__big-play">
              <button className="player__big-play-btn" onClick={togglePlay}>
                <IconPlay size={22} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── WATCH PAGE ──────────────────────────────────────────────────────────────

export default function WatchPage() {
  const { id, videoId } = useParams();
  const [course, setCourse] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const { token, useMock } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = useMock ? Mock.getCourse(id) : await apiGetCourse(id);
      if (!data) return;
      setCourse(data);
      const vid = data.videos.find(v => v.id === Number(videoId)) || data.videos[0];
      setCurrentVideo(vid || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    load();
  }, [id, videoId, token]);

  const markWatched = async () => {
    if (!currentVideo || marking) return;
    setMarking(true);
    try {
      useMock ? Mock.markWatched(currentVideo.id) : await apiMarkWatched(currentVideo.id);
      await load();
    } finally {
      setMarking(false);
    }
  };

  const handleEnded = async () => {
    if (currentVideo && !currentVideo.is_watched) await markWatched();
  };

  const goTo = (vid) => navigate(`/course/${id}/watch/${vid.id}`, { replace: true });

  if (loading) {
    return (
      <div className="app">
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!course || !currentVideo) {
    return (
      <div className="app">
        <Navbar />
        <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-4)' }}>
          Видео не найдено
        </div>
      </div>
    );
  }

  const idx = course.videos.findIndex(v => v.id === currentVideo.id);
  const prev = idx > 0 ? course.videos[idx - 1] : null;
  const next = idx < course.videos.length - 1 ? course.videos[idx + 1] : null;
  const pct = course.lessons_count > 0 ? Math.round((course.watched_count / course.lessons_count) * 100) : 0;

  return (
    <div className="app">
      {/* Compact top nav for watch mode */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 48,
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
      }}>
        <Link to={`/course/${id}`} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 13, color: 'var(--text-3)',
        }}>
          <IconChevronLeft size={13} />
          Назад
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, overflow: 'hidden' }}>
          <IconBook size={13} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {course.title}
          </span>
          <span style={{ color: 'var(--text-4)', flexShrink: 0 }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--text-4)', flexShrink: 0 }}>
            {idx + 1}/{course.videos.length}
          </span>
        </div>

        {/* Mini progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 72, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{pct}%</span>
        </div>
      </div>

      <div className="watch">
        {/* Main */}
        <div className="watch__main">
          <VideoPlayer
            videoUrl={currentVideo.video_url || ''}
            title={currentVideo.title}
            onEnded={handleEnded}
          />

          {/* Info */}
          <div className="watch__info">
            <div style={{ flex: 1 }}>
              <h1 className="watch__title">{currentVideo.title}</h1>
              {currentVideo.description && (
                <p className="watch__desc">{currentVideo.description}</p>
              )}
              {currentVideo.content && (
                <div className="watch__content">
                  {currentVideo.content}
                </div>
              )}
            </div>

          <div className="watch__actions">
              <button
                className={`btn-mark ${currentVideo.is_watched ? 'btn-mark--done' : ''}`}
                onClick={markWatched}
                disabled={currentVideo.is_watched || marking}
              >
                {currentVideo.is_watched
                  ? <><IconCheckCircle size={14} /> Просмотрено</>
                  : <><IconCircle size={14} /> Отметить</>
                }
              </button>
            </div>
          </div>

          {/* Prev / Next */}
          <div className="watch__nav">
            <button
              className="btn-nav"
              onClick={() => prev && goTo(prev)}
              disabled={!prev}
            >
              <IconChevronLeft size={14} />
              Предыдущий
            </button>
            <button
              className="btn-nav btn-nav--next"
              onClick={() => next && goTo(next)}
              disabled={!next}
            >
              Следующий
              <IconChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="watch__sidebar">
          <div className="watch__sidebar-head">
            <span className="watch__sidebar-label">Уроки</span>
            <span className="watch__sidebar-count">{course.watched_count}/{course.videos.length}</span>
          </div>
          <div className="watch__sidebar-prog">
            <div className="watch__sidebar-prog-fill" style={{ width: `${pct}%` }} />
          </div>

          <div className="watch__sidebar-list">
            {course.videos.map((video, i) => {
              const isActive = video.id === currentVideo.id;
              const isWatched = video.is_watched;
              return (
                <div
                  key={video.id}
                  className={`sidebar-lesson ${isActive ? 'sidebar-lesson--active' : ''} ${isWatched && !isActive ? 'sidebar-lesson--watched' : ''}`}
                  onClick={() => goTo(video)}
                >
                  <span className="sidebar-lesson__num">{i + 1}</span>
                  <div className={`sidebar-lesson__icon ${isWatched ? 'sidebar-lesson__icon--watched' : isActive ? 'sidebar-lesson__icon--active' : 'sidebar-lesson__icon--idle'}`}>
                    {isWatched
                      ? <IconCheckCircle size={13} />
                      : isActive
                        ? <IconPlay size={13} />
                        : <IconCircle size={13} />
                    }
                  </div>
                    <div className="sidebar-lesson__body">
                      <div className={`sidebar-lesson__title ${!isActive && !isWatched ? 'sidebar-lesson__title--default' : ''}`}>
                        {video.title}
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
