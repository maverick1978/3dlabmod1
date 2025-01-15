import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Estilos predeterminados
import styles from "./Calendar.module.css";

function TaskCalendar() {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasksForDate, setTasksForDate] = useState([]);
  const [showForm, setShowForm] = useState(false); // Controlar la visibilidad del formulario para crear tarea
  const [showEditForm, setShowEditForm] = useState(false); // Controlar el formulario de edición
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "Pendiente",
    date: new Date().toISOString().split("T")[0], // Fecha predeterminada
  });
  const [editingTask, setEditingTask] = useState(null); // Tarea en edición

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

  // Filtrar tareas para la fecha seleccionada
  useEffect(() => {
    const filteredTasks = tasks.filter((task) => {
      const taskDate = new Date(task.date);
      return (
        taskDate.getFullYear() === selectedDate.getFullYear() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getDate() === selectedDate.getDate()
      );
    });

    setTasksForDate(filteredTasks);
  }, [selectedDate, tasks]);

  // Manejar cambio de fecha en el calendario
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setNewTask((prev) => ({
      ...prev,
      date: date.toISOString().split("T")[0],
    }));
    setShowForm(true); // Mostrar el formulario para crear tarea
  };

  // Manejar cambio en los campos del formulario de creación
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar envío del formulario para crear nueva tarea
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      const createdTask = await response.json();
      setTasks((prev) => [...prev, createdTask]); // Actualizar lista de tareas
      setShowForm(false); // Ocultar formulario
      setNewTask({
        title: "",
        description: "",
        status: "Pendiente",
        date: selectedDate.toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error al crear la tarea:", error);
    }
  };

  // Manejar eliminación de una tarea
  const handleDelete = async (taskId) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error al eliminar la tarea:", error);
    }
  };

  // Abrir el formulario de edición para una tarea seleccionada
  const handleEdit = (task) => {
    setEditingTask(task);
    setShowEditForm(true);
  };

  // Manejar cambio en los campos del formulario de edición
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingTask((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar envío del formulario de edición
  const handleEditFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${editingTask.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingTask),
        }
      );
      const updatedTask = await response.json();

      setTasks((prev) =>
        prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );

      setShowEditForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
    }
  };

  // Función para personalizar los días del calendario
  const tileContent = ({ date }) => {
    const hasTasks = tasks.some((task) => {
      const taskDate = new Date(task.date);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });

    return hasTasks ? <div className={styles.taskIndicator}></div> : null;
  };

  return (
    <div className={styles.container}>
      <h2>Calendario de Tareas</h2>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        className={styles.calendar}
        tileContent={tileContent} // Personalizar los días
      />
      <div className={styles.taskList}>
        <h3>Tareas para el {selectedDate.toLocaleDateString()}</h3>
        {tasksForDate.length > 0 ? (
          tasksForDate.map((task) => (
            <div key={task.id} className={styles.task}>
              <h4>{task.title}</h4>
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
                  className={styles.editButton}
                  onClick={() => handleEdit(task)}
                >
                  Editar
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(task.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No hay tareas para esta fecha.</p>
        )}
      </div>

      {/* Formulario emergente para creación de tarea */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Crear Tarea para el {selectedDate.toLocaleDateString()}</h3>
            <form onSubmit={handleFormSubmit}>
              <div className={styles.formGroup}>
                <label>Título</label>
                <input
                  type="text"
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea
                  name="description"
                  value={newTask.description}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>
              <div className={styles.formGroup}>
                <label>Estado</label>
                <select
                  name="status"
                  value={newTask.status}
                  onChange={handleInputChange}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Progreso">En Progreso</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
              <button type="submit" className={styles.button}>
                Crear Tarea
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Formulario emergente para edición de tarea */}
      {showEditForm && editingTask && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Editar Tarea</h3>
            <form onSubmit={handleEditFormSubmit}>
              <div className={styles.formGroup}>
                <label>Título</label>
                <input
                  type="text"
                  name="title"
                  value={editingTask.title}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea
                  name="description"
                  value={editingTask.description}
                  onChange={handleEditInputChange}
                  required
                ></textarea>
              </div>
              <div className={styles.formGroup}>
                <label>Estado</label>
                <select
                  name="status"
                  value={editingTask.status}
                  onChange={handleEditInputChange}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Progreso">En Progreso</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
              <button type="submit" className={styles.button}>
                Guardar Cambios
              </button>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskCalendar;
