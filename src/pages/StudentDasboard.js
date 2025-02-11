import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  fetchProgress,
  updateProfilePhoto,
} from "../redux/studentSlice";
import styles from "./StudentDasboard.module.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { notifications, progress, studentInfo } = useSelector(
    (state) => state.student
  );
  const [newPhoto, setNewPhoto] = useState(null);

  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchProgress());
  }, [dispatch]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    setNewPhoto(file);
  };

  const saveProfilePhoto = () => {
    if (newPhoto) {
      dispatch(updateProfilePhoto(newPhoto));
      toast.success("Foto actualizada con éxito!");
    } else {
      toast.error("Selecciona una foto primero.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Bienvenido, {studentInfo.name}</h2>
        <p className={styles.text}>Usuario: {studentInfo.username}</p>
        <div className={styles.uploadSection}>
          <label className={styles.label}>Cambia tu foto de perfil:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className={styles.fileInput}
          />
          <button className={styles.button} onClick={saveProfilePhoto}>
            Guardar Foto
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.subtitle}>Progreso Académico</h3>
        {progress.map((item) => (
          <div key={item.stage} className={styles.progressItem}>
            <p className={styles.progressText}>{item.stageName}</p>
            <progress
              value={item.percentage}
              max="100"
              className={styles.progressBar}
            />
          </div>
        ))}
      </div>

      <div className={styles.fullCard}>
        <h3 className={styles.subtitle}>Notificaciones</h3>
        {notifications.map((notification) => (
          <div key={notification.id} className={styles.notificationItem}>
            <p className={styles.notificationTitle}>{notification.title}</p>
            <p className={styles.notificationDetail}>{notification.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
