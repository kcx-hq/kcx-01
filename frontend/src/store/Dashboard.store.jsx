import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Dashboard Global Store
 * - Stores selected uploadIds
 * - Accessible across dashboard pages, widgets, filters
 */
export const useDashboardStore = create(
  persist(
    (set, get) => ({
      /* =========================
         STATE
      ========================= */
      uploadIds: [], // array of uploadId strings
      dashboardPath: "/dashboard", // ✅ default fallback
      setDashboardPath: (dashboardPath) => set({ dashboardPath }),

      /* =========================
         ACTIONS
      ========================= */

      /**
       * Replace all uploadIds
       * @param {string[]} ids
       */
      setUploadIds: (ids = []) =>
        set({
          uploadIds: Array.isArray(ids) ? ids : [],
        }),

      /**
       * Add a single uploadId
       * (idempotent)
       */
      addUploadId: (id) =>
        set((state) => {
          if (!id || state.uploadIds.includes(id)) return state;
          return { uploadIds: [...state.uploadIds, id] };
        }),

      /**
       * Remove a single uploadId
       */
      removeUploadId: (id) =>
        set((state) => ({
          uploadIds: state.uploadIds.filter((x) => x !== id),
        })),

      /**
       * Toggle uploadId selection
       */
      toggleUploadId: (id) =>
        set((state) => ({
          uploadIds: state.uploadIds.includes(id)
            ? state.uploadIds.filter((x) => x !== id)
            : [...state.uploadIds, id],
        })),

      /**
       * Clear all selections
       */
      clearUploadIds: () =>
        set({
          uploadIds: [],
        }),

      /* =========================
         SELECTORS / HELPERS
      ========================= */

      /**
       * Check if an uploadId is selected
       */
      hasUploadId: (id) => get().uploadIds.includes(id),

      /**
       * Count selected uploads
       */
      uploadCount: () => get().uploadIds.length,
    }),
    {
      name: "dashboard-upload-ids", // localStorage key
      partialize: (state) => ({
        uploadIds: state.uploadIds, // persist only uploadIds
      }),
    },
  ),
);
