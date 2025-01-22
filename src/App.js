import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./components/admin/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard/*" element={<Dashboard />} />{" "}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>
        ; ;{/* Subrutas en dashboard */}
      </Routes>
    </Router>
  );
}

export default App;
