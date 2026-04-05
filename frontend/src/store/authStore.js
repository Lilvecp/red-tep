import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      photoUrl:        null,
      login:        (user, token) => set({ user, token, isAuthenticated: true }),
      logout:       ()            => set({ user: null, token: null, isAuthenticated: false, photoUrl: null }),
      updateUser:   (data)        => set((s) => ({ user: { ...s.user, ...data } })),
      setPhotoUrl:  (url)         => set({ photoUrl: url }),
    }),
    { name: 'redtep-auth' }
  )
)

export default useAuthStore
