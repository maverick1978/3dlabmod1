import React, { useState, useEffect } from "react";
import styles from "./CreateUser.module.css";

function CreateUser({ onUserCreated }) {
  const [profiles, setProfiles] = useState([]);
  const [formData, setFormData] = useState({
    role: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    grade: "",
    area: "",
    photo: null,
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [background, setBackground] = useState("#ffffff");
  const [inspirationalQuote, setInspirationalQuote] = useState("");

  // Obtener perfiles desde la base de datos
  useEffect(() => {
    fetch("http://localhost:5000/api/profiles")
      .then((res) => res.json())
      .then((data) => setProfiles(data))
      .catch((err) => console.error("Error al cargar perfiles:", err));
  }, []);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejar la selección de archivo (foto)
  const handleFileChange = (e) => {
    setFormData({ ...formData, photo: e.target.files[0] });
  };

  // Guardar usuario
  const handleSave = () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const newUser = {
      role: formData.role,
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      grade: formData.grade,
      area: formData.area,
      photo: formData.photo,
    };

    fetch("http://localhost:5000/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Usuario creado exitosamente");
        setSelectedUser(`${formData.firstName} ${formData.lastName}`);
        if (onUserCreated) onUserCreated(data);
      })
      .catch((err) => console.error("Error al crear usuario:", err));
  };

  return (
    <div className={styles.createUserContainer} style={{ background }}>
      <h3>Crear Usuario</h3>

      {selectedUser && <h4>Usuario Seleccionado: {selectedUser}</h4>}

      <label>Perfil:</label>
      <select name="role" value={formData.role} onChange={handleInputChange}>
        <option value="">Selecciona un perfil</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.role}>
            {profile.role}
          </option>
        ))}
      </select>

      <label>Nombre:</label>
      <input
        type="text"
        name="firstName"
        value={formData.firstName}
        onChange={handleInputChange}
      />

      <label>Apellido:</label>
      <input
        type="text"
        name="lastName"
        value={formData.lastName}
        onChange={handleInputChange}
      />

      <label>Usuario:</label>
      <input
        type="text"
        name="username"
        value={formData.username}
        onChange={handleInputChange}
      />

      <label>Correo:</label>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
      />

      <label>Contraseña:</label>
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleInputChange}
      />

      <label>Repite Contraseña:</label>
      <input
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleInputChange}
      />

      {formData.role === "Estudiante" && (
        <>
          <label>Grado:</label>
          <select
            name="grade"
            value={formData.grade}
            onChange={handleInputChange}
          >
            <option value="">Selecciona un grado</option>
            <option value="Primero">Primero</option>
            <option value="Segundo">Segundo</option>
          </select>
        </>
      )}

      {formData.role === "Educador" && (
        <>
          <label>Área:</label>
          <select
            name="area"
            value={formData.area}
            onChange={handleInputChange}
          >
            <option value="">Selecciona un área</option>
            <option value="Matemáticas">Matemáticas</option>
            <option value="Español">Español</option>
            <option value="Geografía">Geografía</option>
          </select>
        </>
      )}

      {/* Subir o Capturar Foto */}
      <label>Cargar Fotografía o Capturar</label>
      <input type="file" onChange={handleFileChange} />
      {formData.photo && (
        <img
          src={URL.createObjectURL(formData.photo)}
          alt="Foto de usuario"
          className={styles.photoPreview}
        />
      )}

      {/* Botones adicionales */}
      <button onClick={() => setBackground("#f0f0f0")}>Cambiar Fondo</button>
      <button onClick={() => setInspirationalQuote("¡Sigue adelante!")}>
        Mi frase inspiradora
      </button>

      <button onClick={handleSave}>Guardar</button>
    </div>
  );
}

export default CreateUser;
