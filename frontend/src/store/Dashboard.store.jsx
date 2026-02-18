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
      selectedUploads: [], // [{ uploadId, filename }]
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
        set((state) => {
          const nextIds = Array.isArray(ids) ? ids : [];
          const idSet = new Set(nextIds);
          return {
            uploadIds: nextIds,
            selectedUploads: state.selectedUploads.filter((item) =>
              idSet.has(item.uploadId),
            ),
          };
        }),

      /**
       * Replace selected upload metadata
       * @param {{ uploadId: string, filename: string }[]} uploads
       */
      setSelectedUploads: (uploads = []) =>
        set({
          selectedUploads: Array.isArray(uploads)
            ? uploads.filter((u) => u?.uploadId)
            : [],
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
          selectedUploads: state.selectedUploads.filter(
            (item) => item.uploadId !== id,
          ),
        })),

      /**
       * Toggle uploadId selection
       */
      toggleUploadId: (id) =>
        set((state) => {
          const exists = state.uploadIds.includes(id);
          if (exists) {
            return {
              uploadIds: state.uploadIds.filter((x) => x !== id),
              selectedUploads: state.selectedUploads.filter(
                (item) => item.uploadId !== id,
              ),
            };
          }
          return {
            uploadIds: [...state.uploadIds, id],
          };
        }),

      /**
       * Clear all selections
       */
      clearUploadIds: () =>
        set({
          uploadIds: [],
          selectedUploads: [],
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
        uploadIds: state.uploadIds,
        selectedUploads: state.selectedUploads,
      }),
    },
  ),
);
