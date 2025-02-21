import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminDashboard.module.css";
import ProfileManagement from "./ProfileManagement";
import UserManagement from "./UserManagement";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [, setProfiles] = useState([
    { name: "Administrador", fixed: true, users: 0 },
    { name: "Educador", fixed: true, users: 0 },
    { name: "Estudiante", fixed: true, users: 0 },
  ]);
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Obtener perfiles al cargar la página
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const response = await fetch("http://localhost:5000/api/profiles");
    const data = await response.json();
    setProfiles(data);
  };
  return (
    <div className={styles.container}>
      <div className={styles.dashboard}>
        {/* Panel lateral fijo */}
        <aside className={styles.sidebar}>
          <h3>Administrador</h3>
          <button
            onClick={() => setActiveSection("profile")}
            className={styles.adminButton}
          >
            Crear Perfil
          </button>
          <button
            onClick={() => setActiveSection("users")}
            className={styles.adminButton}
          >
            Crear Usuario
          </button>
          <button
            onClick={() => setActiveSection("grades")}
            className={styles.adminButton}
          >
            Crear Grado
          </button>
          <button
            onClick={() => setActiveSection("classes")}
            className={styles.adminButton}
          >
            Crear Clase
          </button>
          <button
            onClick={() => setActiveSection("reset-password")}
            className={styles.adminButton}
          >
            Reiniciar Contraseña
          </button>
          <button
            onClick={() => setActiveSection("settings")}
            className={styles.adminButton}
          >
            Configuración
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </aside>

        {/* Contenido dinámico en columnas */}
        <main className={styles.mainContent}>
          {activeSection === "profile" && (
            <div>
              <div>
                {/* Sección de Perfiles */}
                <ProfileManagement />
              </div>
            </div>
          )}

          {activeSection === "users" && (
            <div>
              <h3>Crear Usuario</h3>
              {activeSection === "users" && <UserManagement />}
            </div>
          )}

          {activeSection === "grades" && (
            <div>
              <h3>Crear Grado</h3>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Nombre del grado"
                  className={styles.inputField}
                />
                <button className={styles.actionButton}>Crear</button>
              </div>
            </div>
          )}

          {activeSection === "classes" && (
            <div>
              <h3>Crear Clase</h3>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Nombre de la clase"
                  className={styles.inputField}
                />
                <button className={styles.actionButton}>Crear</button>
              </div>
            </div>
          )}

          {activeSection === "reset-password" && (
            <div>
              <h3>Reiniciar Contraseña</h3>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Usuario"
                  className={styles.inputField}
                />
                <button className={styles.actionButton}>Reiniciar</button>
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div>
              <h3>Configuración</h3>
              <p>Ajustes generales de la plataforma.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
