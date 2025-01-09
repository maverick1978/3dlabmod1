import React, { useState, useEffect } from "react";
import styles from "./WorkArea.module.css";

function WorkArea() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Pendiente",
  });
  const [editingTask, setEditingTask] = useState(null);

  // Cargar tareas desde el backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/tasks");
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error("Error al cargar tareas:", error);
      }
    };

    fetchTasks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingTask) {
      // Actualizar tarea existente
      try {
        const response = await fetch(
          `http://localhost:5000/api/tasks/${editingTask.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }
        );
        const updatedTask = await response.json();
        setTasks((prev) =>
          prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
        );
        setEditingTask(null);
      } catch (error) {
        console.error("Error al actualizar la tarea:", error);
      }
    } else {
      // Crear nueva tarea
      try {
        const response = await fetch("http://localhost:5000/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const newTask = await response.json();
        setTasks((prev) => [...prev, newTask]);
      } catch (error) {
        console.error("Error al crear la tarea:", error);
      }
    }

    setForm({ title: "", description: "", status: "Pendiente" });
  };

  const handleEdit = (task) => {
    setForm(task);
    setEditingTask(task);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: "DELETE",
      });
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Error al eliminar la tarea:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Área de Trabajo</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Título</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Descripción</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <div className={styles.formGroup}>
          <label>Estado</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="Pendiente">Pendiente</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Completado">Completado</option>
          </select>
        </div>
        <button type="submit" className={styles.button}>
          {editingTask ? "Guardar Cambios" : "Añadir Tarea"}
        </button>
      </form>

      <div className={styles.taskList}>
        {tasks.map((task) => (
          <div key={task.id} className={styles.task}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <span
              className={`${styles.status} ${
                styles[task.status.toLowerCase()]
              }`}
            >
              {task.status}
            </span>
            <div className={styles.actions}>
              <button
                onClick={() => handleEdit(task)}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WorkArea;
