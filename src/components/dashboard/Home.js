import React from "react";
import styles from "./Home.module.css";

function Home() {
  return (
    <div className={styles.container}>
      <h2>Bienvenido al Dashboard</h2>
      <p>
        Esta es tu página de inicio. Desde aquí podrás acceder a todas las
        funcionalidades disponibles.
      </p>
    </div>
  );
}

export default Home;
