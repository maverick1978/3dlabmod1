import React, { useEffect, useState } from "react";
import styles from "./Reports.module.css";

function Reports() {
  const [report, setReport] = useState({});

  useEffect(() => {
    const fetchReport = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setReport(data);
    };

    fetchReport();
  }, []);

  return (
    <div className={styles.container}>
      <h2>Reportes y Estadísticas</h2>
      <div className={styles.stats}>
        <div>
          <h3>Usuarios</h3>
          <p>Total: {report.users}</p>
        </div>
        <div>
          <h3>Tareas</h3>
          <p>Pendientes: {report.pendingTasks}</p>
          <p>Completadas: {report.completedTasks}</p>
        </div>
        <div>
          <h3>Notificaciones</h3>
          <p>Total enviadas: {report.notifications}</p>
        </div>
      </div>
    </div>
  );
}

export default Reports;
