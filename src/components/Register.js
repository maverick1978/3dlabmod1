import React, { useState } from "react";
import styles from "./Register.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "Estudiante", // Valor predeterminado para el rol
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(
          "Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador."
        );
        window.location.href = "/";
      } else {
        alert(data.error || "Error en el registro");
      }
    } catch (error) {
      console.error("Error en el registro:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2>Registro</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <FontAwesomeIcon icon={faUser} className={styles.icon} />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre Completo"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <FontAwesomeIcon icon={faEnvelope} className={styles.icon} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Correo"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <FontAwesomeIcon icon={faUser} className={styles.icon} />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Usuario"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <FontAwesomeIcon icon={faLock} className={styles.icon} />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contraseña"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <FontAwesomeIcon icon={faLock} className={styles.icon} />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmar Contraseña"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="role" className={styles.label}>
              Rol:
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="Estudiante">Estudiante</option>
              <option value="Educador">Educador</option>
            </select>
          </div>
          <button type="submit" className={styles.button}>
            Registrarse
          </button>
        </form>
        <p className={styles.redirect}>
          ¿Ya tienes cuenta? <a href="/">Inicia sesión aquí</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
