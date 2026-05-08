import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      photoUrl:        null,
      followStats:     { followers: 0, following: 0 },
      login:           (user, token) => set({ user, token, isAuthenticated: true }),
      logout:          ()            => set({ user: null, token: null, isAuthenticated: false, photoUrl: null, followStats: { followers: 0, following: 0 } }),
      updateUser:      (data)        => set((s) => ({ user: { ...s.user, ...data } })),
      setPhotoUrl:     (url)         => set({ photoUrl: url }),
      setFollowStats:  (stats)       => set({ followStats: stats }),
    }),
    { name: 'redtep-auth' }
  )
)

export default useAuthStore
