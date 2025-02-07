import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./components/admin/AdminDashboard";
import UserManagement from "./components/admin/UserManagement";
import TaskManagement from "./components/admin/TaskManagement";
import Reports from "./components/admin/Reports";
import ClassManagement from "./components/admin/ClassManagement"; // ✅ Corregido

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas protegidas para dashboard genérico */}
        <Route path="/dashboard/*" element={<Dashboard />} />

        {/* Rutas protegidas para administrador */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin" />}>
          {/* Subrutas del panel de administrador */}
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="tasks" element={<TaskManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="classes" element={<ClassManagement />} />{" "}
          {/* ✅ Nueva ruta */}
        </Route>

        {/* Ruta por defecto para manejar no coincidencias */}
        <Route path="*" element={<div>Ruta no encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;
