import React, { useState } from "react";
import styles from "./Settings.module.css";

function Settings() {
  const [theme, setTheme] = useState("light");

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
    alert(`Tema cambiado a: ${e.target.value}`);
  };

  return (
    <div className={styles.container}>
      <h2>Configuración</h2>
      <div className={styles.option}>
        <label>Tema del Dashboard</label>
        <select
          value={theme}
          onChange={handleThemeChange}
          className={styles.select}
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>
    </div>
  );
}

export default Settings;
