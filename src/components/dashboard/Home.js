import React, { useState, useEffect } from "react";
import styles from "./Home.module.css";

function Home() {
  // Estado para almacenar los datos del usuario (desde la tabla users)
  const [educator, setEducator] = useState(null);
  // Estado para manejar errores
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEducatorData = async () => {
      try {
        // 1. Leer la información del usuario guardada en localStorage.
        // Se espera que al iniciar sesión se guarde un objeto con { id, user, role }
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          setError("No se encontró información del usuario en localStorage.");
          return;
        }
        const user = JSON.parse(storedUser);
        console.log("Usuario desde localStorage:", user);

        // 2. Verificar que el usuario tenga rol "Educador"
        if (!user || user.role !== "Educador") {
          setError("No estás logueado como Educador.");
          return;
        }

        // 3. Hacer la petición al endpoint que devuelve los datos completos del usuario (tabla users)
        const response = await fetch(
          `http://localhost:5000/api/profiles/${user.id}`
        );
        if (!response.ok) {
          throw new Error(`Error al obtener datos: ${response.status}`);
        }
        const data = await response.json();
        console.log("Datos del educador:", data);
        setEducator(data);
      } catch (err) {
        console.error("Error en fetchEducatorData:", err);
        setError(err.message);
      }
    };

    fetchEducatorData();
  }, []);

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  if (!educator) {
    return <div className={styles.loading}>Cargando datos...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Inicio Educador</h2>
      {/* Contenedor de dos columnas */}
      <div className={styles.twoColumns}>
        {/* Columna Izquierda: Datos y acciones */}
        <div className={styles.leftColumn}>
          <div className={styles.dataSection}>
            <p>
              <strong>Usuario:</strong> {educator.user || "N/A"}
            </p>
            <p>
              <strong>Nombre:</strong>{" "}
              {(educator.firstName || "N/A") +
                " " +
                (educator.lastName || "N/A")}
            </p>
            <p>
              <strong>Correo:</strong> {educator.email || "N/A"}
            </p>
            <p>
              <strong>Área:</strong> {educator.area || "N/A"}
            </p>
          </div>
          <div className={styles.changePassword}>
            <label>Cambio de clave:</label>
            <input
              type="password"
              placeholder="Nueva clave"
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Repite clave"
              className={styles.input}
            />
            <button className={styles.button}>Guardar clave</button>
          </div>
          <div className={styles.workArea}>
            <label>Área a trabajar hoy:</label>
            <select className={styles.select}>
              <option value="Matemáticas">Matemáticas</option>
              <option value="Español">Español</option>
              <option value="Geografía">Geografía</option>
            </select>
            <button className={styles.button}>Continuar</button>
          </div>
        </div>

        {/* Columna Derecha: Foto y personalización */}
        <div className={styles.rightColumn}>
          <div className={styles.photoContainer}>
            {educator.photo ? (
              <img
                src={`http://localhost:5000/uploads/${educator.photo}`}
                alt="Foto del Educador"
                className={styles.photo}
              />
            ) : (
              <div className={styles.placeholderPhoto}>Sin foto</div>
            )}
          </div>
          <div className={styles.customOptions}>
            <button className={styles.button}>Cambiar Fondo</button>
            <button className={styles.button}>Mi frase inspiradora</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
