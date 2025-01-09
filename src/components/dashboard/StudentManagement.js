import React, { useState, useEffect } from "react";
import styles from "./StudentManagement.module.css";

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [recommendation, setRecommendation] = useState("");

  useEffect(() => {
    // Cargar estudiantes desde el backend
    const fetchStudents = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/students");
        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error("Error al cargar estudiantes:", error);
      }
    };

    fetchStudents();
  }, []);

  const handleSendRecommendation = async () => {
    if (!selectedStudent || !recommendation.trim()) {
      alert("Selecciona un estudiante y escribe una recomendación.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/students/${selectedStudent.id}/recommendation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recommendation }),
        }
      );

      if (response.ok) {
        alert("Recomendación enviada.");
        setRecommendation("");
      } else {
        alert("Error al enviar la recomendación.");
      }
    } catch (error) {
      console.error("Error al enviar la recomendación:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Gestión de Estudiantes</h2>
      <div className={styles.studentList}>
        <h3>Estudiantes</h3>
        <ul>
          {students.map((student) => (
            <li
              key={student.id}
              className={`${styles.studentItem} ${
                selectedStudent?.id === student.id ? styles.selected : ""
              }`}
              onClick={() => setSelectedStudent(student)}
            >
              {student.name}
            </li>
          ))}
        </ul>
      </div>

      {selectedStudent && (
        <div className={styles.details}>
          <h3>Detalle del Estudiante</h3>
          <p>
            <strong>Nombre:</strong> {selectedStudent.name}
          </p>
          <p>
            <strong>Progreso:</strong> {selectedStudent.progress}%
          </p>

          <div className={styles.recommendation}>
            <textarea
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="Escribe una recomendación"
            ></textarea>
            <button
              onClick={handleSendRecommendation}
              className={styles.button}
            >
              Enviar Recomendación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentManagement;
