import React, { useEffect, useState } from "react";
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
import "../StudentDashboard.module.css";

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, progress, studentInfo } = useSelector(
    (state) => state.student
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inspirationalPhrase, setInspirationalPhrase] = useState("");
  const [projects, setProjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    dispatch(fetchStudentData());
    dispatch(fetchNotifications());
    dispatch(fetchProgress());
    fetchProjects();
    fetchRecommendations();
  }, [dispatch]);

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
    <div className="container">
      <nav className="navbar">
        <span className="logo">Dashboard Estudiante</span>
        <ul className="navLinks">
          <li>
            <Button onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </Button>
          </li>
        </ul>
      </nav>
      <div className="content">
        <Card>
          <CardContent>
            <h2>Bienvenido, {studentInfo.name}</h2>
            <p>Usuario: {studentInfo.username}</p>
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

        <Card>
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

        <Card>
          <CardContent>
            <h3>Notificaciones</h3>
            {notifications.map((notification) => (
              <div key={notification.id} className="item">
                <p>{notification.title}</p>
                <p>{notification.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3>Proyectos</h3>
            {projects.map((project) => (
              <div key={project.id} className="item">
                <p>{project.name}</p>
                <p>{project.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3>Recomendaciones</h3>
            {recommendations.map((rec) => (
              <div key={rec.id} className="item">
                <p>{rec.content}</p>
                <p>Fecha: {rec.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
