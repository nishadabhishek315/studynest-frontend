import api from "./axios";

export const getSeats = (params) => api.get("/seats", { params });
export const getSeat = (id) => api.get(`/seats/${id}`);
export const getSeatStats = () => api.get("/seats/stats");
export const createSeat = (data) => api.post("/seats", data);
export const updateSeat = (id, data) => api.put(`/seats/${id}`, data);
// slot: 'morning' | 'evening' | 'full_day'
export const assignSeat = (id, memberId, slot) =>
  api.patch(`/seats/${id}/assign`, { memberId, slot: slot || "full_day" });
// slot: 'morning' | 'evening' | undefined (releases all)
export const releaseSeat = (id, slot) =>
  api.patch(`/seats/${id}/release`, slot ? { slot } : {});
export const deleteSeat = (id) => api.delete(`/seats/${id}`);
