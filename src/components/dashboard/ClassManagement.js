import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ClassManagement.module.css";

function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [educators, setEducators] = useState([]);
  const [students, setStudents] = useState([]);
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
    fetchStudents();
  }, []);

  // Obtener clases
  const fetchClasses = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:5000/api/classes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setClasses(data);
  };

  // Obtener educadores
  const fetchEducators = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      "http://localhost:5000/api/users?role=Educador",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    setEducators(data);
  };

  // Obtener estudiantesrevisa
  const fetchStudents = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      "http://localhost:5000/api/users?role=Estudiante",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    setStudents(data);
  };

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Crear o actualizar clase
  const handleSave = async () => {
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
      fetchClasses();
      setEditingClass(null);
      setFormData({ name: "", grade: "", educator_id: "" });
    }
  };

  // Eliminar clase
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/classes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchClasses();
  };

  // Editar clase
  const startEditing = (classItem) => {
    setEditingClass(classItem.id);
    setFormData({
      name: classItem.name,
      grade: classItem.grade,
      educator_id: classItem.educator_id || "",
    });
  };

  return (
    <div className={styles.container}>
      <h2>Gestión de Clases</h2>

      {/* Formulario para agregar/editar clases */}
      <div className={styles.formContainer}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Nombre de la clase"
          required
        />
        <input
          type="text"
          name="grade"
          value={formData.grade}
          onChange={handleInputChange}
          placeholder="Grado"
          required
        />
        <select
          name="educator_id"
          value={formData.educator_id}
          onChange={handleInputChange}
        >
          <option value="">Seleccionar Educador</option>
          {educators.map((edu) => (
            <option key={edu.id} value={edu.id}>
              {edu.user}
            </option>
          ))}
        </select>
        <button onClick={handleSave}>
          {editingClass ? "Actualizar Clase" : "Agregar Clase"}
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
      {/* Mostrar la lista de estudiantes */}
      {students.length > 0 ? (
        <div>
          <h3>Lista de Estudiantes</h3>
          <ul>
            {students.map((student) => (
              <li key={student.id}>{student.name}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No hay estudiantes registrados.</p>
      )}

      {/* Botón para regresar al menú principal */}
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
