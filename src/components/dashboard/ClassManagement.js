import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ClassManagement.module.css";

function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [educators, setEducators] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    educator_id: "",
  });
  const [editingClass, setEditingClass] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
    fetchEducators();
  }, []);

  // Obtener lista de educadores
  const fetchEducators = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/users?role=Educador",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Error al obtener educadores.");
      const data = await response.json();
      setEducators(data);
    } catch (error) {
      console.error("Error cargando educadores:", error);
    }
  };

  // Obtener lista de clases con educador asignado
  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al obtener clases.");
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error("Error cargando clases:", error);
    }
  };

  // Cargar datos en el formulario cuando se edita una clase
  const startEditing = (classItem) => {
    setEditingClass(classItem.id);
    setFormData({
      name: classItem.name,
      grade: classItem.grade,
      educator_id: classItem.educator_id || "", // ✅ Asegurar que educator_id esté presente
    });
  };

  // Guardar o actualizar clase con educador
  const handleSave = async () => {
    if (!formData.name || !formData.grade || !formData.educator_id) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    const token = localStorage.getItem("token");
    const url = editingClass
      ? `http://localhost:5000/api/classes/${editingClass}`
      : "http://localhost:5000/api/classes";
    const method = editingClass ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      fetchClasses(); // ✅ Recargar la lista de clases después de actualizar
      setEditingClass(null);
      setFormData({ name: "", grade: "", educator_id: "" });
    } else {
      alert("Error al guardar la clase.");
    }
  };

  // Eliminar clase
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:5000/api/classes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("Clase eliminada correctamente.");
        fetchClasses();
      } else {
        throw new Error("Error al eliminar la clase.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Gestión de Clases</h2>

      {/* Formulario para crear/editar clases */}
      <div className={styles.formGroup}>
        <h3>{editingClass ? "Editar Clase" : "Crear Nueva Clase"}</h3>
        <label>Nombre de la Clase:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <label>Grado:</label>
        <input
          type="text"
          name="grade"
          value={formData.grade}
          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
        />
        <label>Educador:</label>
        <select
          name="educator_id"
          value={formData.educator_id}
          onChange={(e) =>
            setFormData({ ...formData, educator_id: e.target.value })
          }
        >
          <option value="">Seleccionar Educador</option>
          {educators.map((educator) => (
            <option key={educator.id} value={educator.id}>
              {educator.user}
            </option>
          ))}
        </select>
        <button onClick={handleSave} className={styles.assignButton}>
          {editingClass ? "Actualizar Clase" : "Crear Clase"}
        </button>
      </div>

      {/* Tabla de clases */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Grado</th>
            <th>Educador</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((classItem) => (
            <tr key={classItem.id}>
              <td>{classItem.name}</td>
              <td>{classItem.grade}</td>
              <td>
                {educators.find((edu) => edu.id === classItem.educator_id)
                  ?.user || "No asignado"}
              </td>
              <td>
                <button onClick={() => startEditing(classItem)}>Editar</button>
                <button onClick={() => handleDelete(classItem.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className={styles.backButton}
        onClick={() => navigate("/admin/dashboard")}
      >
        Volver al Menú Principal
      </button>
    </div>
  );
}

export default ClassManagement;
