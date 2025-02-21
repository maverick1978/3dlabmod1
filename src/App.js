import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./components/admin/AdminDashboard";
import UserManagement from "./components/admin/UserManagement";
import TaskManagement from "./components/admin/TaskManagement";
import Reports from "./components/admin/Reports";
import ClassManagement from "./components/dashboard/ClassManagement";
import StudentDashboard from "./pages/StudentDasboard"; // Mueve el import al lugar correcto

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Rutas del dashboard del estudiante */}
          <Route path="/dashboard/student" element={<StudentDashboard />} />

          {/* Rutas públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/classes" element={<ClassManagement />} />
          {/* Rutas protegidas para dashboard genérico */}
          <Route path="/dashboard/*" element={<Dashboard />} />
          {/* Rutas protegidas para administrador */}
          <Route
            path="/admin"
            element={<ProtectedRoute requiredRole="Administrador" />}
          >
            {/* Subrutas del panel de administrador */}
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="tasks" element={<TaskManagement />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          {/* Ruta por defecto para manejar no coincidencias */}
          <Route path="*" element={<div>Ruta no encontrada</div>} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
