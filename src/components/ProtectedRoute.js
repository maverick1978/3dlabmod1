import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ requiredRole }) => {
  const token = localStorage.getItem("token"); // Recuperar el token del almacenamiento local
  const user = token ? JSON.parse(atob(token.split(".")[1])) : null; // Decodificar el token

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
