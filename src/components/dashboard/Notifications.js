import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import styles from "./Notifications.module.css";

const socket = io("http://localhost:5000");

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState("all");

  // Función para formatear la fecha
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/notifications${
            filter !== "all" ? `?type=${filter}` : ""
          }`
        );
        const data = await response.json();

        // Asegurarse de que cada notificación tenga una fecha
        const notificationsWithDates = data.map((notification) => ({
          ...notification,
          date: notification.date || new Date().toISOString(), // Agregar fecha actual si falta
        }));

        setNotifications(notificationsWithDates);
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      }
    };

    fetchNotifications();

    // Escuchar nuevas notificaciones
    socket.on("new-notification", (notification) => {
      const notificationWithDate = {
        ...notification,
        date: notification.date || new Date().toISOString(),
      };
      setNotifications((prev) => [notificationWithDate, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [filter]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
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

  const deleteNotification = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: "DELETE",
      });

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    } catch (error) {
      console.error("Error al eliminar la notificación:", error);
    }
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
          >
            <div onClick={() => openNotification(notification)}>
              <div>{notification.title}</div>
              <div className={styles.date}>
                Publicado el: {formatDate(notification.date)}
              </div>
              {!notification.read && (
                <span className={styles.unreadMarker}>●</span>
              )}
            </div>
            <button
              className={styles.deleteButton}
              onClick={() => deleteNotification(notification.id)}
            >
              ✖
            </button>
          </li>
        ))}
      </ul>

      {selectedNotification && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h3>{selectedNotification.title}</h3>
            <p>{selectedNotification.detail}</p>
            <div className={styles.date}>
              Publicado el: {formatDate(selectedNotification.date)}
            </div>
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
