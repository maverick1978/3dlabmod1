import React, { useState } from "react";
import styles from "./Register.module.css";

function Register() {
  // Estado local para los campos del formulario
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "Estudiante", // Por defecto "Estudiante"
    grade: "Primero", // Por defecto "Primero"
  });

  // Maneja el cambio de valores en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      // Construimos el objeto que se enviará al servidor
      const bodyToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        grade: formData.grade,
        // area: '',  // Si deseas manejar "area", podrías incluirlo aquí
      };

      // Hacemos la petición POST al endpoint /api/register
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyToSend),
      });

      const data = await response.json();

      if (response.ok) {
        // Si el registro fue exitoso:
        alert(
          "Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador."
        );
        // Redirigir al login (o a donde gustes)
        window.location.href = "/";
      } else {
        // Si hubo error, lo mostramos
        alert(data.error || "Error en el registro");
      }
    } catch (error) {
      console.error("Error en el registro:", error);
      alert("Ocurrió un error al intentar registrarte.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2>Registro</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Campo de Nombres */}
          <div className={styles.formGroup}>
            <label htmlFor="firstName">Nombre</label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Campo de Apellidos */}
          <div className={styles.formGroup}>
            <label htmlFor="lastName">Apellido</label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Campo de Correo */}
          <div className={styles.formGroup}>
            <label htmlFor="email">Correo</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Campo de Usuario */}
          <div className={styles.formGroup}>
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          {/* Campo de Contraseña */}
          <div className={styles.formGroup}>
            <label htmlFor="password">Clave</label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Campo de Confirmar Contraseña */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Repetir Clave</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {/* Campo de Rol */}
          <div className={styles.formGroup}>
            <label htmlFor="role">Perfil</label>
            <select
              name="role"
              id="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="Estudiante">Estudiante</option>
              <option value="Educador">Educador</option>
            </select>
          </div>

          {/* Campo de Grado (solo si el rol es Estudiante) */}
          {formData.role === "Estudiante" && (
            <div className={styles.formGroup}>
              <label htmlFor="grade">Grado</label>
              <select
                name="grade"
                id="grade"
                value={formData.grade}
                onChange={handleChange}
              >
                <option value="Primero">Primero</option>
                <option value="Segundo">Segundo</option>
                <option value="Tercero">Tercero</option>
              </select>
            </div>
          )}

          {/* Botón para crear la cuenta */}
          <button type="submit" className={styles.button}>
            Crear
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
