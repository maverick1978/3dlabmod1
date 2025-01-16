import React, { useState } from "react";
import styles from "./Profile.module.css";

function Profile() {
  const [formData, setFormData] = useState({
    name: "Nombre Usuario",
    email: "usuario@ejemplo.com",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Perfil actualizado");
    console.log("Datos enviados:", formData);
  };

  return (
    <div className={styles.container}>
      <h2>Mi Perfil</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Nombre</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Correo</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Contraseña</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nueva contraseña"
          />
        </div>
        <button type="submit" className={styles.button}>
          Actualizar Perfil
        </button>
      </form>
    </div>
  );
}

export default Profile;
