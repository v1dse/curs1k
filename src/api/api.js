

const BASE = process.env.REACT_APP_API_URL || '';

function getToken() {
  return localStorage.getItem('sp_token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(BASE + path, opts);

  if (res.status === 401) {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Server error' }));
    throw new Error(err.detail || 'Request failed');
  }

  return res.json();
}

// ─── AUTH ──────────────────────────────────────────────────────────────────────

export async function apiLogin(username, password) {
  // FastAPI OAuth2 expects form data for /token endpoint
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const res = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Неверный логин или пароль' }));
    throw new Error(err.detail || 'Ошибка входа');
  }

  const data = await res.json();
  // FastAPI returns: { access_token, token_type, user: { id, username, role } }
  return data;
}

export async function apiVerify() {
  return request('GET', '/api/auth/me');
}

// ─── COURSES ───────────────────────────────────────────────────────────────────

export async function apiGetCourses() {
  return request('GET', '/api/courses');
}

export async function apiGetCourse(id) {
  return request('GET', `/api/courses/${id}`);
}

// Admin course management (FastAPI backend)
export async function apiCreateCourse(payload) {
  return request('POST', '/api/admin/courses', payload);
}

export async function apiUpdateCourse(id, payload) {
  return request('PUT', `/api/admin/courses/${id}`, payload);
}

export async function apiDeleteCourse(id, adminPassword) {
  return request('DELETE', `/api/admin/courses/${id}`, { admin_password: adminPassword });
}

// ─── VIDEO PROGRESS ────────────────────────────────────────────────────────────

export async function apiMarkWatched(videoId) {
  return request('POST', '/api/progress/mark', { video_id: videoId });
}

export async function apiUnmarkWatched(videoId) {
  return request('DELETE', `/api/progress/${videoId}`);
}

export async function apiGetProgress(courseId) {
  return request('GET', `/api/progress/course/${courseId}`);
}


// Remove this section once FastAPI is connected

const MOCK_COURSES = [
  {
    id: 1,
    title: 'React & TypeScript — Полный курс',
    subtitle: 'От первых компонентов до продакшн-приложения',
    description: 'Освой современный стек React 18 с TypeScript от основ до продвинутых паттернов.',
    instructor_name: 'Влад Коваль',
    level: 'Intermediate',
    category: 'Frontend',
    lessons_count: 6,
    watched_count: 0,
    videos: [
      { id: 101, title: 'Введение и настройка окружения', duration: '08:42', is_watched: false, description: 'Установка Node.js, Vite, TypeScript.' },
      { id: 102, title: 'JSX и компоненты', duration: '14:20', is_watched: false, description: 'Функциональные компоненты, props.' },
      { id: 103, title: 'useState и useEffect', duration: '18:05', is_watched: false, description: 'Управление состоянием.' },
      { id: 104, title: 'TypeScript типы', duration: '22:30', is_watched: false, description: 'Типизация компонентов.' },
      { id: 105, title: 'React Router v6', duration: '19:48', is_watched: false, description: 'Маршрутизация.' },
      { id: 106, title: 'Финальный проект', duration: '45:00', is_watched: false, description: 'Сборка приложения с нуля.' },
    ],
  },
  {
    id: 2,
    title: 'FastAPI — Backend разработка',
    subtitle: 'JWT, SQLAlchemy и продакшн API на Python',
    description: 'Создавай быстрые REST API на Python с FastAPI. JWT, SQLAlchemy, Pydantic.',
    instructor_name: 'Андрей Мельник',
    level: 'Intermediate',
    category: 'Backend',
    lessons_count: 5,
    watched_count: 0,
    videos: [
      { id: 201, title: 'Введение в FastAPI', duration: '10:15', is_watched: false, description: 'Первый эндпоинт, Swagger UI.' },
      { id: 202, title: 'Pydantic модели', duration: '15:40', is_watched: false, description: 'Валидация данных.' },
      { id: 203, title: 'JWT аутентификация', duration: '28:05', is_watched: false, description: 'OAuth2, bcrypt, токены.' },
      { id: 204, title: 'Загрузка файлов и видео', duration: '16:30', is_watched: false, description: 'Chunked upload, стриминг.' },
      { id: 205, title: 'Docker и деплой', duration: '30:10', is_watched: false, description: 'Dockerfile, docker-compose.' },
    ],
  },
  {
    id: 3,
    title: 'PostgreSQL — от нуля до профи',
    subtitle: 'Практика SQL и оптимизации запросов',
    description: 'Реляционные БД, сложные запросы, индексы, транзакции и оптимизация.',
    instructor_name: 'Сергей Павленко',
    level: 'Beginner',
    category: 'Database',
    lessons_count: 4,
    watched_count: 0,
    videos: [
      { id: 301, title: 'Установка и первые шаги', duration: '09:30', is_watched: false, description: 'psql, pgAdmin, команды.' },
      { id: 302, title: 'SELECT запросы', duration: '24:15', is_watched: false, description: 'WHERE, JOIN, GROUP BY.' },
      { id: 303, title: 'Индексы и производительность', duration: '18:40', is_watched: false, description: 'B-tree, EXPLAIN ANALYZE.' },
      { id: 304, title: 'Транзакции и MVCC', duration: '20:05', is_watched: false, description: 'ACID, уровни изоляции.' },
    ],
  },
  {
    id: 4,
    title: 'Docker и Kubernetes',
    subtitle: 'Контейнеризация и оркестрация микросервисов',
    description: 'Контейнеризация, оркестрация, CI/CD пайплайны. Production-деплой.',
    instructor_name: 'Дмитрий Яценко',
    level: 'Advanced',
    category: 'DevOps',
    lessons_count: 5,
    watched_count: 0,
    videos: [
      { id: 401, title: 'Docker основы', duration: '16:00', is_watched: false, description: 'Images, containers, volumes.' },
      { id: 402, title: 'Dockerfile best practices', duration: '14:30', is_watched: false, description: 'Multi-stage builds.' },
      { id: 403, title: 'Docker Compose', duration: '19:20', is_watched: false, description: 'Многосервисные приложения.' },
      { id: 404, title: 'Введение в Kubernetes', duration: '25:45', is_watched: false, description: 'Pod, Deployment, Service.' },
      { id: 405, title: 'CI/CD с GitHub Actions', duration: '22:35', is_watched: false, description: 'Автоматический деплой.' },
    ],
  },
];

const WATCH_KEY = 'sp_mock_watch';
const COURSES_KEY = 'sp_mock_courses';

function mockLoadWatch() {
  try { return JSON.parse(localStorage.getItem(WATCH_KEY) || '{}'); } catch { return {}; }
}
function mockSaveWatch(s) { localStorage.setItem(WATCH_KEY, JSON.stringify(s)); }

function mockLoadCourses() {
  try {
    const raw = localStorage.getItem(COURSES_KEY);
    if (!raw) return MOCK_COURSES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : MOCK_COURSES;
  } catch {
    return MOCK_COURSES;
  }
}

function mockSaveCourses(courses) {
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

function applyWatch(courses) {
  const w = mockLoadWatch();
  return courses.map(c => {
    const videos = (c.videos || []).map(v => ({ ...v, is_watched: !!w[v.id] }));
    return {
      ...c,
      videos,
      lessons_count: c.lessons_count ?? videos.length,
      watched_count: videos.filter(v => v.is_watched).length,
    };
  });
}

export const Mock = {
  login(username, password) {
    const accounts = { admin: { pass: 'admin123', role: 'admin' }, user: { pass: 'user123', role: 'user' }, vlad: { pass: 'vlad123', role: 'user' } };
    const acc = accounts[username];
    if (!acc || acc.pass !== password) throw new Error('Неверный логин или пароль');
    return { access_token: 'mock_' + Date.now(), token_type: 'bearer', user: { id: 1, username, role: acc.role } };
  },
  getCourses() {
    const courses = mockLoadCourses();
    // гарантируем, что старая версия без localStorage тоже сохраняется
    mockSaveCourses(courses);
    return applyWatch(courses);
  },
  getCourse(id) {
    const courses = mockLoadCourses();
    return applyWatch(courses).find(c => c.id === Number(id)) || null;
  },
  markWatched(videoId) { const s = mockLoadWatch(); s[videoId] = true; mockSaveWatch(s); },
  unmarkWatched(videoId) { const s = mockLoadWatch(); delete s[videoId]; mockSaveWatch(s); },
  createCourse(payload) {
    const courses = mockLoadCourses();
    const nextId = courses.reduce((max, c) => Math.max(max, c.id || 0), 0) + 1;
    const base = {
      id: nextId,
      title: payload.title?.trim() || `Новый курс #${nextId}`,
      description: payload.description?.trim() || '',
      subtitle: payload.subtitle?.trim() || '',
      instructor_name: payload.instructor_name?.trim() || 'Admin',
      level: payload.level || 'Beginner',
      category: payload.category || 'Frontend',
      lessons_count: Number(payload.lessons_count) || 0,
      watched_count: 0,
      videos: [],
    };
    const next = [...courses, base];
    mockSaveCourses(next);
    return base;
  },
  deleteCourse(id) {
    const numId = Number(id);
    const courses = mockLoadCourses();
    const course = courses.find(c => c.id === numId);
    const next = courses.filter(c => c.id !== numId);
    mockSaveCourses(next);
    if (course && Array.isArray(course.videos) && course.videos.length) {
      const s = mockLoadWatch();
      let changed = false;
      for (const v of course.videos) {
        if (s[v.id]) {
          delete s[v.id];
          changed = true;
        }
      }
      if (changed) mockSaveWatch(s);
    }
  },
  updateCourse(id, payload) {
    const numId = Number(id);
    const courses = mockLoadCourses();
    const idx = courses.findIndex(c => c.id === numId);
    if (idx === -1) return null;
    const prev = courses[idx];
    const videos = Array.isArray(payload.videos) ? payload.videos.map(v => ({
      id: v.id,
      title: v.title?.trim() || 'Без названия',
      duration: v.duration || '00:00',
      description: v.description?.trim() || '',
      video_url: v.video_url?.trim() || '',
      content: v.content?.trim() || '',
    })) : (prev.videos || []);
    const nextCourse = {
      ...prev,
      title: payload.title?.trim() || prev.title,
      description: payload.description?.trim() ?? prev.description,
      instructor_name: payload.instructor_name?.trim() || prev.instructor_name || 'Admin',
      level: payload.level || prev.level || 'Beginner',
      category: payload.category || prev.category || 'Frontend',
      lessons_count: videos.length,
      videos,
    };
    const next = [...courses];
    next[idx] = nextCourse;
    mockSaveCourses(next);
    return nextCourse;
  },
};
