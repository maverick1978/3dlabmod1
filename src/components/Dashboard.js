import React from "react";
import { Link, Routes, Route } from "react-router-dom";
import styles from "./Dashboard.module.css";
import Home from "./dashboard/Home";
import Profile from "./dashboard/Profile";
import Settings from "./dashboard/Settings";
import Notifications from "./dashboard/Notifications";
import StudentManagement from "./dashboard/StudentManagement";
import WorkArea from "./dashboard/WorkArea";
import TaskCalendar from "./dashboard/Calendar";

function Dashboard() {
  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h1 className={styles.logo}>Dashboard</h1>
        <ul className={styles.navLinks}>
          <li>
            <Link to="/dashboard/home">Inicio</Link>
          </li>
          <li>
            <Link to="/dashboard/profile">Perfil</Link>
          </li>
          <li>
            <Link to="/dashboard/settings">Configuración</Link>
          </li>
          <li>
            <Link to="/dashboard/notifications">Notificaciones</Link>
          </li>
          <li>
            <Link to="/dashboard/StudentsManagement">Estudiantes</Link>
          </li>
          <li>
            <Link to="/dashboard/work-area">Área de Trabajo</Link>
          </li>
          <li>
            <Link to="/dashboard/calendar">Calendario</Link>
          </li>
          <li>
            <Link to="/">Cerrar Sesión</Link>
          </li>
        </ul>
      </nav>

      <div className={styles.content}>
        <Routes>
          <Route path="home" element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="StudentsManagement" element={<StudentManagement />} />
          <Route path="work-area" element={<WorkArea />} />
          <Route path="calendar" element={<TaskCalendar />} />
        </Routes>
      </div>
    </div>
  );
}

export default Dashboard;
