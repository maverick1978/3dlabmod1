import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Estilos predeterminados
import styles from "./Calendar.module.css";

function TaskCalendar() {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasksForDate, setTasksForDate] = useState([]);

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
      const taskDate = new Date(task.date); // Asume que las tareas tienen un campo `date` en formato YYYY-MM-DD
      return (
        taskDate.getFullYear() === selectedDate.getFullYear() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getDate() === selectedDate.getDate()
      );
    });

    setTasksForDate(filteredTasks);
  }, [selectedDate, tasks]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className={styles.container}>
      <h2>Calendario de Tareas</h2>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        className={styles.calendar}
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
            </div>
          ))
        ) : (
          <p>No hay tareas para esta fecha.</p>
        )}
      </div>
    </div>
  );
}

export default TaskCalendar;
