import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

export const fetchNotifications = createAsyncThunk(
  "student/fetchNotifications",
  async () => {
    const response = await api.get("/api/notifications");
    return response.data;
  }
);

export const fetchProgress = createAsyncThunk(
  "student/fetchProgress",
  async () => {
    const response = await api.get("/api/students/1/history"); // Usar el ID correcto
    return response.data;
  }
);

export const updateProfilePhoto = createAsyncThunk(
  "student/updateProfilePhoto",
  async (photo) => {
    const formData = new FormData();
    formData.append("photo", photo);
    const response = await api.post("/api/students/photo", formData);
    return response.data;
  }
);

const studentSlice = createSlice({
  name: "student",
  initialState: {
    notifications: [],
    progress: [],
    studentInfo: { name: "Estudiante", username: "user123" },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })
      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.progress = action.payload;
      })
      .addCase(updateProfilePhoto.fulfilled, (state, action) => {
        state.studentInfo.photo = action.payload.photo;
      });
  },
});

export default studentSlice.reducer;
