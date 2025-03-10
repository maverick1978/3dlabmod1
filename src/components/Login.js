import React, { useState } from "react";
import styles from "./Login.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function Login() {
  // Estados para guardar el usuario y la contraseña ingresados en el formulario
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Función que se ejecuta cuando el formulario se envía
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Realiza la petición al backend enviando el usuario y la contraseña
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });

      // Verificamos que la respuesta sea JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Respuesta inesperada del servidor.");
      }

      // Convertimos la respuesta a objeto JSON
      const data = await response.json();

      // Si el inicio de sesión es exitoso, guardamos la información en localStorage
      if (response.ok) {
        localStorage.setItem("token", data.token);
        // Guarda el id, user y role en localStorage usando la respuesta del servidor
        localStorage.setItem(
          "user",
          JSON.stringify({ id: data.id, user: data.user, role: data.role })
        );
        alert("Inicio de sesión exitoso");

        // Redirigir según el rol del usuario
        switch (data.role) {
          case "Administrador":
            navigate("/admin/dashboard");
            break;
          case "Estudiante":
            navigate("/dashboard/student");
            break;
          case "Educador":
            navigate("/dashboard");
            break;
          default:
            alert("Rol desconocido. Contacte al administrador.");
            break;
        }
      } else {
        alert(data.error || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Error en el login:", error);
      alert("No se pudo conectar con el servidor. Verifica tu conexión.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <FontAwesomeIcon icon={faUser} className={styles.icon} />
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Usuario"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <FontAwesomeIcon icon={faLock} className={styles.icon} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
            />
          </div>
          <button type="submit" className={styles.button}>
            Iniciar Sesión
          </button>
        </form>
        <p className={styles.redirect}>
          ¿No tienes cuenta? <a href="/register">Regístrate aquí</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
