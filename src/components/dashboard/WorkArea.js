import React, { useState, useEffect, useRef } from "react";
import styles from "./WorkArea.module.css";

function WorkArea() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Pendiente",
    date: new Date().toISOString().split("T")[0], // Fecha predeterminada: hoy
  });
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState("all");
  const descriptionRef = useRef(null);

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

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "date" ? new Date(value).toISOString().split("T")[0] : value, // Normalizar fecha
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingTask) {
      // Actualizar tarea
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

    setForm({
      title: "",
      description: "",
      status: "Pendiente",
      date: new Date().toISOString().split("T")[0], // Resetear a la fecha actual
    });
  };

  const handleEdit = (task) => {
    setForm({
      ...task,
      date: new Date(task.date).toISOString().split("T")[0], // Convertir a formato aceptado por input[type="date"]
    });
    setEditingTask(task);

    setTimeout(() => {
      descriptionRef.current?.focus();
      descriptionRef.current?.select();
    }, 0);
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

      {/* Menú de Filtros */}
      <div className={styles.filter}>
        <label>Filtrar por estado:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En Progreso">En Progreso</option>
          <option value="Completado">Completado</option>
        </select>
      </div>

      {/* Formulario */}
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
            ref={descriptionRef}
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
        <div className={styles.formGroup}>
          <label>Fecha</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className={styles.button}>
          {editingTask ? "Guardar Cambios" : "Añadir Tarea"}
        </button>
      </form>

      {/* Lista de Tareas */}
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
            <p>Fecha: {new Date(task.date).toLocaleDateString()}</p>
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
