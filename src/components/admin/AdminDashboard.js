import React from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import styles from "./AdminDashboard.module.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Eliminar el token del almacenamiento local
    alert("Has cerrado sesión correctamente.");
    navigate("/"); // Redirigir a la página principal
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1>Panel del Administrador</h1>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>
        <nav className={styles.nav}>
          <Link to="/admin/users" className={styles.navLink}>
            Gestión de Usuarios
          </Link>
          <Link to="/admin/tasks" className={styles.navLink}>
            Gestión de Tareas
          </Link>
          <Link to="/admin/reports" className={styles.navLink}>
            Reportes y Estadísticas
          </Link>
        </nav>
      </header>
      <main className={styles.content}>
        <Outlet /> {/* Renderizará las vistas anidadas */}
      </main>
    </div>
  );
}

export default AdminDashboard;
