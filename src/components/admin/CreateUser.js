import React, { useState, useEffect } from "react";
import styles from "./CreateUser.module.css";

function CreateUser({ fetchUsers }) {
  const [users, setUsers] = useState([]); // Lista de usuarios
  const [profiles, setProfiles] = useState([]); // Lista de perfiles
  const [selectedUser, setSelectedUser] = useState(null); // Usuario seleccionado para edición
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    photo: null,
  });

  // Cargar usuarios y perfiles desde la base de datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No autenticado");

        const usersRes = await fetch("http://localhost:5000/api/users", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Se envía el token correctamente
          },
        });

        if (!usersRes.ok) throw new Error("Error al obtener usuarios");
        const usersData = await usersRes.json();
        setUsers(usersData);

        const profilesRes = await fetch("http://localhost:5000/api/profiles", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!profilesRes.ok) throw new Error("Error al obtener perfiles");
        const profilesData = await profilesRes.json();
        setProfiles(profilesData);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    fetchData();
  }, []);

  // Manejo de cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo de carga de imagen
  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, photo: e.target.files[0] }));
  };

  // Seleccionar usuario para edición
  const handleSelectUser = (user) => {
    setSelectedUser(user.id);
    setFormData({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
      photo: null,
    });
  };

  // Guardar usuario nuevo o actualizado
  const handleSave = async () => {
    if (!formData.username || !formData.email || !formData.role) {
      alert("Todos los campos son obligatorios");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No autenticado");
      return;
    }

    const method = selectedUser ? "PUT" : "POST";
    const url = selectedUser
      ? `http://localhost:5000/api/users/${selectedUser}`
      : "http://localhost:5000/api/users";

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formDataToSend,
    });

    if (response.ok) {
      alert("Usuario guardado correctamente");
      setFormData({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
        photo: null,
      });
      fetchUsers();
    } else {
      alert("Error al guardar el usuario");
    }
  };

  // Eliminar usuario (excepto Administrador)
  const handleDeleteUser = async (userId, role) => {
    if (role === "Administrador") {
      alert("El administrador no se puede eliminar");
      return;
    }

    const confirmDelete = window.confirm(
      "¿Estás seguro de eliminar este usuario?"
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      alert("Usuario eliminado correctamente");
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } else {
      alert("Error al eliminar el usuario");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Crear Usuario</h2>

      {/* Mostrar nombre del usuario seleccionado */}
      {selectedUser && <h3>Usuario seleccionado: {formData.username}</h3>}

      {/* Formulario de creación / edición */}
      <div className={styles.formGroup}>
        <label>Nombre de Usuario:</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
        />

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

        <label>Confirmar Contraseña:</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
        />

        <label>Perfil:</label>
        <select name="role" value={formData.role} onChange={handleInputChange}>
          <option value="">Seleccionar Perfil</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.role}>
              {profile.role} - {profile.description}
            </option>
          ))}
        </select>

        <label>Foto:</label>
        <input type="file" onChange={handleFileChange} />

        <button onClick={handleSave}>
          {selectedUser ? "Actualizar Usuario" : "Crear Usuario"}
        </button>
      </div>

      {/* Lista de usuarios */}
      <h3>Usuarios Registrados</h3>
      <ul className={styles.userList}>
        {users.length > 0 ? (
          users.map((user) => (
            <li key={user.id} className={styles.userItem}>
              <span onClick={() => handleSelectUser(user)}>
                {user.username} - {user.email} ({user.role})
              </span>
              {user.role !== "Administrador" && (
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteUser(user.id, user.role)}
                >
                  Eliminar
                </button>
              )}
            </li>
          ))
        ) : (
          <p>No hay usuarios registrados.</p>
        )}
      </ul>
    </div>
  );
}

export default CreateUser;
