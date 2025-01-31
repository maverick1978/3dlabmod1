import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Importamos useNavigate
import styles from "./TaskManager.module.css";

function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    date: "",
  });
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

  // Iniciar edición de tarea
  const startEditing = (task) => {
    setEditingTask(task.id);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      date: task.date,
    });
  };

  // Manejar cambios en el formulario de edición
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Guardar cambios en la tarea
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/tasks/${editingTask}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    setTasks((prev) =>
      prev.map((task) =>
        task.id === editingTask ? { ...task, ...formData } : task
      )
    );

    setEditingTask(null);
    setFormData({ title: "", description: "", status: "", date: "" });
  };

  // Filtrar tareas según la búsqueda
  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <h2>Gestión de Tareas</h2>

      {/* 🔍 Barra de búsqueda */}
      <input
        type="text"
        placeholder="Buscar tarea..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.searchBar}
      />

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
          {filteredTasks.map((task) => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>{task.description}</td>
              <td>{task.status}</td>
              <td>{task.date}</td>
              <td>
                {editingTask === task.id ? (
                  <>
                    <button onClick={handleSave} className={styles.saveButton}>
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingTask(null)}
                      className={styles.cancelButton}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditing(task)}
                      className={styles.editButton}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className={styles.deleteButton}
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingTask && (
        <div className={styles.editForm}>
          <h3>Editar Tarea</h3>
          <form>
            <label>
              Título:
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Descripción:
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Estado:
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En progreso">En progreso</option>
                <option value="Completada">Completada</option>
              </select>
            </label>
            <label>
              Fecha:
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </label>
          </form>
        </div>
      )}

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
