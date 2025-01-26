import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Importamos useNavigate
import styles from "./TaskManager.module.css";

function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate(); // Hook para redirigir

  // Cargar tareas desde el backend
  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setTasks(data);
    };

    fetchTasks();
  }, []);

  // Manejar eliminación de tareas
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <div className={styles.container}>
      <h2>Gestión de Tareas</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>{task.description}</td>
              <td>{task.status}</td>
              <td>{task.date}</td>
              <td>
                <button
                  onClick={() => handleDelete(task.id)}
                  className={styles.deleteButton}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botón para regresar al menú principal */}
      <button
        className={styles.backButton}
        onClick={() => navigate("/admin/dashboard")}
      >
        Volver al Menú Principal
      </button>
    </div>
  );
}

export default TaskManager;
