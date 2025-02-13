import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

export const fetchStudentData = createAsyncThunk(
  "student/fetchStudentData",
  async () => {
    const response = await api.get("/api/users?role=Estudiante");
    return response.data[0]; // Supone el primer estudiante
  }
);

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

const studentSlice = createSlice({
  name: "student",
  initialState: {
    notifications: [],
    progress: [],
    studentInfo: { name: "", username: "" },
  },
  reducers: {
    logout: (state) => {
      state.notifications = [];
      state.progress = [];
      state.studentInfo = { name: "", username: "" };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentData.fulfilled, (state, action) => {
        state.studentInfo = action.payload;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })
      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.progress = action.payload;
      });
  },
});
export const { logout } = studentSlice.actions;
export default studentSlice.reducer;
