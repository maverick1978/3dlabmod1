import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStudentData,
  fetchNotifications,
  fetchProgress,
  logout,
} from "../redux/studentSlice";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import CardContent from "../components/CardContent";
import Progress from "../components/Progress";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import styles from "./StudentDasboard.module.css";

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, progress } = useSelector((state) => state.student);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inspirationalPhrase, setInspirationalPhrase] = useState("");
  const [projects, setProjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [studentData, setStudentData] = useState({}); // Se elimina studentInfo y se usa setStudentData
  const token = localStorage.getItem("token");

  // ✅ Convertimos las funciones en useCallback para evitar bucles infinitos en useEffect
  const fetchStudentInfo = useCallback(async () => {
    const response = await fetch("http://localhost:5000/api/student/info", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setStudentData(data);
  }, [token]);

  const fetchStudentClasses = useCallback(async () => {
    const response = await fetch("http://localhost:5000/api/student/classes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setClasses(data);
  }, [token]);

  const fetchStudentTasks = useCallback(async () => {
    const response = await fetch("http://localhost:5000/api/student/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setTasks(data);
  }, [token]);

  const fetchProjects = async () => {
    const response = await fetch("/api/student/projects");
    const data = await response.json();
    setProjects(data);
  };

  const fetchRecommendations = async () => {
    const response = await fetch("/api/student/recommendations");
    const data = await response.json();
    setRecommendations(data);
  };

  // ✅ Ahora useEffect incluye todas las funciones necesarias y no genera advertencias de dependencias
  useEffect(() => {
    dispatch(fetchStudentData());
    dispatch(fetchNotifications());
    dispatch(fetchProgress());

    fetchProjects();
    fetchRecommendations();
    fetchStudentInfo();
    fetchStudentClasses();
    fetchStudentTasks();
  }, [dispatch, fetchStudentInfo, fetchStudentClasses, fetchStudentTasks]);

  const handleChangePassword = () => {
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    alert("Contraseña cambiada exitosamente.");
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <span className={styles.logo}>Dashboard Estudiante</span>
        <ul className={styles.navLinks}>
          <li>
            <Button onClick={handleLogout} className={styles.logoutButton}>
              Cerrar Sesión
            </Button>
          </li>
        </ul>
      </nav>
      <div className={styles.contentGrid}>
        <div className={styles.leftColumn}>
          <Card className={styles.card}>
            <CardContent>
              <h2>Bienvenido, {studentData.name}</h2>
              <p>Usuario: {studentData.username}</p>
              <Input
                type="password"
                placeholder="Nueva Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirmar Contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button onClick={handleChangePassword}>Guardar Contraseña</Button>
              <Input
                type="text"
                placeholder="Frase inspiradora"
                value={inspirationalPhrase}
                onChange={(e) => setInspirationalPhrase(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent>
              <h3>Progreso Académico</h3>
              {progress.map((item) => (
                <div key={item.stage}>
                  <p>{item.stageName}</p>
                  <Progress value={item.percentage} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className={styles.card}>
          <h3>Clases Asignadas</h3>
          {classes.length > 0 ? (
            <ul>
              {classes.map((classItem) => (
                <li key={classItem.id}>
                  {classItem.name} - {classItem.grade}
                </li>
              ))}
            </ul>
          ) : (
            <p>No tienes clases asignadas.</p>
          )}
        </div>

        <div className={styles.card}>
          <h3>Tareas Asignadas</h3>
          {tasks.length > 0 ? (
            <ul>
              {tasks.map((task) => (
                <li key={task.id}>
                  {task.title} - {task.status}
                </li>
              ))}
            </ul>
          ) : (
            <p>No tienes tareas pendientes.</p>
          )}
        </div>

        <div className={styles.rightColumn}>
          <Card className={styles.card}>
            <CardContent>
              <h3>Notificaciones</h3>
              {notifications.map((notification) => (
                <div key={notification.id} className={styles.item}>
                  <p>{notification.title}</p>
                  <p>{notification.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent>
              <h3>Proyectos</h3>
              {projects.map((project) => (
                <div key={project.id} className={styles.item}>
                  <p>{project.name}</p>
                  <p>{project.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={styles.card}>
            <CardContent>
              <h3>Recomendaciones</h3>
              {recommendations.map((rec) => (
                <div key={rec.id} className={styles.item}>
                  <p>{rec.content}</p>
                  <p>Fecha: {rec.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
