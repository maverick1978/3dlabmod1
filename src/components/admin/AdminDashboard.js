import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminDashboard.module.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalReports: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setStats(data);
    };

    fetchStats();
  }, []);

  return (
    <div className={styles.container}>
      <h2>Panel de Administrador</h2>

      {/* 🔹 Sección de Métricas */}
      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <h3>Usuarios Registrados</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className={styles.metricCard}>
          <h3>Tareas Pendientes</h3>
          <p>{stats.pendingTasks}</p>
        </div>
        <div className={styles.metricCard}>
          <h3>Tareas Completadas</h3>
          <p>{stats.completedTasks}</p>
        </div>
        <div className={styles.metricCard}>
          <h3>Reportes Generados</h3>
          <p>{stats.totalReports}</p>
        </div>
      </div>

      {/* 🔹 Accesos Directos */}
      <div className={styles.quickAccess}>
        <button onClick={() => navigate("/admin/users")}>
          Gestión de Usuarios
        </button>
        <button onClick={() => navigate("/admin/tasks")}>
          Gestión de Tareas
        </button>
        <button onClick={() => navigate("/admin/reports")}>
          Reportes y Estadísticas
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;
