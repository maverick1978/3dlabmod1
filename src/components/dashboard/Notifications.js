import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import styles from "./Notifications.module.css";

const socket = io("http://localhost:5000");

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState("all"); // Estado para el filtro

  useEffect(() => {
    // Cargar notificaciones iniciales
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/notifications${
            filter !== "all" ? `?type=${filter}` : ""
          }`
        );
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      }
    };

    fetchNotifications();

    // Escuchar nuevas notificaciones en tiempo real
    socket.on("new-notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [filter]); // Vuelve a cargar las notificaciones si cambia el filtro

  const handleFilterChange = (e) => {
    setFilter(e.target.value); // Actualiza el filtro seleccionado
  };

  const markAsRead = (id) => {
    fetch(`http://localhost:5000/api/notifications/${id}/read`, {
      method: "POST",
    });
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const openNotification = (notification) => {
    setSelectedNotification(notification);
    markAsRead(notification.id);
  };

  const closeNotification = () => {
    setSelectedNotification(null);
  };

  return (
    <div className={styles.container}>
      <h2>Notificaciones</h2>

      {/* Menú de Filtros */}
      <div className={styles.filter}>
        <label>Filtrar por:</label>
        <select value={filter} onChange={handleFilterChange}>
          <option value="all">Todas</option>
          <option value="Tareas">Tareas</option>
          <option value="Mensajes">Mensajes</option>
          <option value="Calificaciones">Calificaciones</option>
        </select>
      </div>

      <ul className={styles.list}>
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className={`${styles.notification} ${
              notification.read ? styles.read : ""
            }`}
            onClick={() => openNotification(notification)}
          >
            {notification.title}
            {!notification.read && (
              <span className={styles.unreadMarker}>●</span>
            )}
          </li>
        ))}
      </ul>

      {selectedNotification && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h3>{selectedNotification.title}</h3>
            <p>{selectedNotification.detail}</p>
            <button onClick={closeNotification} className={styles.closeButton}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
