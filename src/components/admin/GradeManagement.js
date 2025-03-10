import React, { useState, useEffect } from "react";
import styles from "./GradeManagement.module.css";

function GradeManagement() {
  const [grados, setGrados] = useState([]);
  const [nombreGrado, setNombreGrado] = useState("");

  // Función para cargar grados
  const fetchGrados = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/grados");
      const data = await response.json();
      setGrados(data);
    } catch (error) {
      console.error("Error al obtener grados:", error);
    }
  };

  useEffect(() => {
    fetchGrados();
  }, []);

  const handleCrearGrado = async () => {
    if (!nombreGrado.trim()) return;
    try {
      const response = await fetch("http://localhost:5000/api/grados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreGrado }),
      });
      const data = await response.json();
      if (response.ok) {
        setNombreGrado("");
        fetchGrados();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error al crear el grado:", error);
    }
  };

  const handleEliminarGrado = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/grados/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        fetchGrados();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error al eliminar el grado:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h3>Crear Grado</h3>
      <div className={styles.formGroup}>
        <input
          type="text"
          placeholder="Nombre del grado"
          className={styles.inputField}
          value={nombreGrado}
          onChange={(e) => setNombreGrado(e.target.value)}
        />
        <button className={styles.actionButton} onClick={handleCrearGrado}>
          Crear
        </button>
      </div>

      <h4>Listado de Grados</h4>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Estudiantes</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {grados.map((grado) => (
              <tr key={grado.id}>
                <td>{grado.id}</td>
                <td>{grado.nombre}</td>
                <td>{grado.numEstudiantes}</td>
                <td>
                  {grado.numEstudiantes > 0 ? (
                    <span>-</span>
                  ) : (
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleEliminarGrado(grado.id)}
                    >
                      X
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GradeManagement;
