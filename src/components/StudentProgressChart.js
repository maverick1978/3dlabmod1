import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import "./StudentProgressChart.css"; // Importa el archivo CSS

const StudentProgressChart = ({ studentId }) => {
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    axios
      .get(`/api/students/${studentId}/progress`)
      .then((response) => {
        setProgressData(response.data.progress);
      })
      .catch((error) => {
        console.error("Error al obtener los datos de progreso:", error);
      });
  }, [studentId]);

  const data = {
    labels: ["Etapa 1", "Etapa 2", "Etapa 3", "Etapa 4"],
    datasets: [
      {
        label: "Progreso del Estudiante",
        data: progressData,
        fill: false,
        backgroundColor: "rgb(75, 192, 192)",
        borderColor: "rgba(75, 192, 192, 0.2)",
      },
    ],
  };

  return (
    <div className="chart-container">
      <h2 className="chart-title">Progreso del Estudiante</h2>
      <Line data={data} />
    </div>
  );
};

export default StudentProgressChart;
