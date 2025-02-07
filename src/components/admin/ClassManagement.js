import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ClassManagement.module.css";

function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [educators, setEducators] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedEducator, setSelectedEducator] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [newClass, setNewClass] = useState({ name: "", grade: "" });

  const navigate = useNavigate();

  // 🔹 Cargar datos desde la BD
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [classesRes, studentsRes, educatorsRes] = await Promise.all([
        fetch("http://localhost:5000/api/classes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/users?role=Estudiante", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/users?role=Educador", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!classesRes.ok || !studentsRes.ok || !educatorsRes.ok) {
        throw new Error("Error al cargar los datos");
      }

      const [classesData, studentsData, educatorsData] = await Promise.all([
        classesRes.json(),
        studentsRes.json(),
        educatorsRes.json(),
      ]);

      setClasses(classesData);
      setStudents(studentsData);
      setEducators(educatorsData.filter((user) => user.role === "Educador"));
    } catch (error) {
      console.error("Error al cargar los datos:", error);
    }
  };

  // 🔹 Crear una nueva clase
  const createClass = async () => {
    if (!newClass.name || !newClass.grade) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:5000/api/classes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newClass),
    });

    if (response.ok) {
      const newClassData = await response.json();
      setClasses([...classes, newClassData]);
      setNewClass({ name: "", grade: "" });
      alert("Clase creada correctamente.");
    } else {
      alert("Error al crear la clase.");
    }
  };

  // 🔹 Asignar un educador a una clase
  const assignEducatorToClass = async (classId) => {
    if (!selectedEducator) {
      alert("Seleccione un educador.");
      return;
    }

    const token = localStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5000/api/classes/${classId}/assign-educator`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ educatorId: selectedEducator }),
      }
    );

    if (response.ok) {
      alert("Educador asignado correctamente.");
      setClasses((prev) =>
        prev.map((clase) =>
          clase.id === classId
            ? { ...clase, educator_id: selectedEducator }
            : clase
        )
      );
    } else {
      alert("Error al asignar el educador.");
    }
  };

  // 🔹 Asignar estudiante a una clase
  const assignStudentToClass = async () => {
    if (!selectedClass || !selectedStudent) {
      alert("Debe seleccionar una clase y un estudiante.");
      return;
    }

    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:5000/api/assign-student", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        classId: selectedClass,
        studentId: selectedStudent,
      }),
    });

    if (response.ok) {
      alert("Estudiante asignado correctamente.");
      fetchData(); // 🔹 Actualiza la lista de clases y asignaciones
    } else {
      alert("Error al asignar estudiante.");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Gestión de Clases</h2>

      {/* 🔹 Formulario para crear una clase */}
      <h3>📌 Crear Nueva Clase</h3>
      <div className={styles.formGroup}>
        <label>Nombre de la Clase:</label>
        <input
          type="text"
          name="name"
          value={newClass.name}
          onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
        />

        <label>Grado:</label>
        <input
          type="text"
          name="grade"
          value={newClass.grade}
          onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
        />

        <button onClick={createClass} className={styles.createButton}>
          ✅ Crear Clase
        </button>
      </div>

      {/* 🔹 Lista de Clases Existentes */}
      <h3>📚 Clases Existentes</h3>
      <ul>
        {classes.map((clase) => (
          <li key={clase.id}>
            <strong>{clase.name}</strong> - {clase.grade} (👨‍🏫{" "}
            {educators.find((ed) => ed.id === clase.educator_id)?.user ||
              "No asignado"}
            )
            <div>
              <label>Asignar Educador:</label>
              <select onChange={(e) => setSelectedEducator(e.target.value)}>
                <option value="">-- Seleccionar --</option>
                {educators.map((educator) => (
                  <option key={educator.id} value={educator.id}>
                    {educator.user}
                  </option>
                ))}
              </select>
              <button onClick={() => assignEducatorToClass(clase.id)}>
                ✅ Asignar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* 🔹 Asignación de estudiantes */}
      <h3>Asignar Estudiante a Clase</h3>
      <div className={styles.formGroup}>
        <label>Selecciona una Clase:</label>
        <select onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">-- Seleccionar --</option>
          {classes.map((clase) => (
            <option key={clase.id} value={clase.id}>
              {clase.name}
            </option>
          ))}
        </select>

        <label>Selecciona un Estudiante:</label>
        <select onChange={(e) => setSelectedStudent(e.target.value)}>
          <option value="">-- Seleccionar --</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.user}
            </option>
          ))}
        </select>

        <button onClick={assignStudentToClass} className={styles.assignButton}>
          📌 Asignar Estudiante
        </button>
      </div>

      <button
        className={styles.backButton}
        onClick={() => navigate("/admin/dashboard")}
      >
        ⬅️ Volver al Menú Principal
      </button>
    </div>
  );
}

export default ClassManagement;
