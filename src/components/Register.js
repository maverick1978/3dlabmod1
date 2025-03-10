import React, { useState, useEffect } from "react";
import styles from "./Register.module.css";

function Register() {
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "", // Inicialmente vacío, se asignará al cargar los perfiles
    grade: "Primero", // Valor por defecto para grado
  });

  // Estado para almacenar los perfiles que se cargan desde el backend
  const [profiles, setProfiles] = useState([]);

  // useEffect se ejecuta cuando se monta el componente y carga los perfiles desde el endpoint /api/profiles
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const response = await fetch("http://localhost:5000/api/profiles");
        const data = await response.json();
        setProfiles(data);

        // Establece el rol por defecto:
        // Se busca el perfil "Estudiante" o se toma el primero de la lista si no existe
        const defaultRole =
          data.find((profile) => profile.role === "Estudiante") || data[0];
        if (defaultRole) {
          setFormData((prev) => ({ ...prev, role: defaultRole.role }));
        }
      } catch (error) {
        console.error("Error al cargar los perfiles:", error);
      }
    }
    fetchProfiles();
  }, []);

  // Función para manejar los cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    // Construir el objeto que se enviará al servidor
    const bodyToSend = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      username: formData.username,
      password: formData.password,
      role: formData.role, // Aquí se envía el nombre del perfil (por ejemplo, "Estudiante")
      grade: formData.grade,
      // area: "", // Puedes incluir más campos si es necesario
    };

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyToSend),
      });
      const data = await response.json();

      if (response.ok) {
        alert(
          "Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador."
        );
        // Redirigir a la página de inicio o login
        window.location.href = "/";
      } else {
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
          {/* Campo de Nombre */}
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

          {/* Campo de Apellido */}
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

          {/* Campo de Perfil */}
          <div className={styles.formGroup}>
            <label htmlFor="role">Perfil</label>
            <select
              name="role"
              id="role"
              value={formData.role}
              onChange={handleChange}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.role}>
                  {profile.role}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de Grado (solo se muestra si el perfil es "Estudiante") */}
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

          {/* Botón para enviar el formulario */}
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
