import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Services ─────────────────────────────────────────────────────────────────

export const authService = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
}

export const workerService = {
  getMe:         ()        => api.get('/workers/me'),
  updateMe:      (data)    => api.put('/workers/me', data),
  getById:       (id)      => api.get(`/workers/${id}`),
  getByUserId:   (userId)  => api.get(`/workers/user/${userId}`),
  search:        (filters) => api.get('/workers/search', { params: filters }),
  uploadMedia:   (fd)      => api.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const companyService = {
  getMe:               ()       => api.get('/companies/me'),
  updateMe:            (data)   => api.put('/companies/me', data),
  getAll:              ()       => api.get('/companies'),
  search:              (q)      => api.get('/companies/search', { params: { q } }),
  getPublic:           (userId) => api.get(`/companies/user/${userId}`),
  requestVerification: ()       => api.post('/companies/me/request-verification'),
}

export const ofertaService = {
  getAll:    (filters) => api.get('/ofertas', { params: filters }),
  getById:   (id)      => api.get(`/ofertas/${id}`),
  create:    (data)    => api.post('/ofertas', data),
  update:    (id, d)   => api.put(`/ofertas/${id}`, d),
  postular:  (id)      => api.post(`/ofertas/${id}/postular`),
}

export const adminService = {
  getMetrics:      ()           => api.get('/admin/metrics'),
  getWorkers:      ()           => api.get('/admin/workers'),
  getPending:      ()           => api.get('/admin/companies/pending'),
  getAllCompanies:  ()           => api.get('/admin/companies'),
  approveCompany:  (id)         => api.put(`/admin/companies/${id}/approve`),
  verifyCompany:   (id)         => api.put(`/admin/companies/${id}/verify`),
  createValidacion:(data)       => api.post('/admin/validaciones', data),
  getAllUsers:      ()           => api.get('/admin/users'),
  assignRole:      (id, role)   => api.put(`/admin/users/${id}/role`, { role }),
}

export const mediaService = {
  getFeed:   (params) => api.get('/media', { params }),
  uploadUrl: (fd)     => api.post('/media/upload-url', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const eventoService = {
  getAll:          ()          => api.get('/eventos'),
  create:          (data)      => api.post('/eventos', data),
  remove:          (id)        => api.delete(`/eventos/${id}`),
  getComments:     (id)        => api.get(`/eventos/${id}/comments`),
  addComment:      (id, data)  => api.post(`/eventos/${id}/comments`, data),
  deleteComment:   (id, cid)   => api.delete(`/eventos/${id}/comments/${cid}`),
  getReactions:    (id)        => api.get(`/eventos/${id}/reactions`),
  toggleReaction:  (id, emoji) => api.post(`/eventos/${id}/reactions`, { emoji }),
}

export const postService = {
  getAll:          (params)   => api.get('/posts', { params }),
  create:          (data)     => api.post('/posts', data),
  update:          (id, data) => api.put(`/posts/${id}`, data),
  remove:          (id)       => api.delete(`/posts/${id}`),
  getReactions:    (id)       => api.get(`/posts/${id}/reactions`),
  toggleReaction:  (id)       => api.post(`/posts/${id}/reactions`),
  getComments:     (id)       => api.get(`/posts/${id}/comments`),
  addComment:      (id, data) => api.post(`/posts/${id}/comments`, data),
  deleteComment:   (id, cid)  => api.delete(`/posts/${id}/comments/${cid}`),
}

export const followService = {
  follow:        (followingId) => api.post('/follows', { followingId }),
  unfollow:      (followingId) => api.delete(`/follows/${followingId}`),
  getStatus:     (followingId) => api.get(`/follows/status/${followingId}`),
  getMyFollowing:()            => api.get('/follows/my-following'),
  getMyStats:    ()            => api.get('/follows/my-stats'),
}

export const notificationService = {
  getAll:   () => api.get('/notifications'),
  readAll:  () => api.put('/notifications/read-all'),
}

export const filterService = {
  getAll:  (tipo) => api.get('/filters', { params: { tipo } }),
  create:  (data) => api.post('/filters', data),
  remove:  (id)   => api.delete(`/filters/${id}`),
}
