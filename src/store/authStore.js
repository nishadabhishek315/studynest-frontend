import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,

      setAuth: (token, refreshToken, user) =>
        set({ token, refreshToken, user }),

      setToken: (token) => set({ token }),

      logout: () => set({ token: null, refreshToken: null, user: null }),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      isAdmin: () => get().user?.role === "admin",
    }),
    {
      name: "studynest-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);

export default useAuthStore;
