import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UserManagement.module.css";

function UserManagement() {
  // Estados para almacenar la lista de usuarios, perfiles, y datos del formulario.
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  // editingUser guarda el ID del usuario que se está editando (si es nulo, se asume creación)
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    user: "",
    email: "",
    role: "", // Este campo se actualizará al seleccionar un perfil desde el dropdown
    password: "",
    firstName: "",
    lastName: "",
    grade: "",
    area: "",
    photo: null,
  });
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Estados para almacenar opciones fijas (pueden venir de un API en una app real)
  const [grades] = useState(["Primero", "Segundo", "Tercero"]);
  const [areas] = useState(["Matemáticas", "Español", "Geografía"]);

  // useEffect para cargar los usuarios desde el backend cuando se monta el componente
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  // useEffect para cargar los perfiles desde el backend (endpoint /api/profiles)
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/profiles");
        const data = await response.json();
        // Aquí podrías filtrar perfiles que no quieras mostrar, por ejemplo:
        // const filtered = data.filter(profile => profile.role !== "Administrador");
        setProfiles(data);
      } catch (error) {
        console.error("Error al cargar perfiles:", error);
      }
    };
    fetchProfiles();
  }, []);

  // Filtrado de usuarios según el texto de búsqueda
  const filteredUsers = users.filter(
    (user) =>
      user.user.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Función para cambiar el estado de aprobación de un usuario
  const handleApproveToggle = async (id, currentStatus) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === 1 ? 0 : 1;

    const response = await fetch(
      `http://localhost:5000/api/users/${id}/approve`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved: newStatus }),
      }
    );

    if (response.ok) {
      // Actualizamos el estado de la lista de usuarios
      setUsers((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, approved: newStatus } : user
        )
      );
    }
  };

  // Manejo de cambios en los campos de texto del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejo del campo de tipo file para la foto del usuario
  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      photo: e.target.files[0],
    }));
  };

  // Al cambiar la selección del perfil en el dropdown se actualiza el formData
  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setFormData((prev) => ({
      ...prev,
      role: selectedRole,
      // Reiniciamos campos específicos si cambió el rol
      grade: "",
      area: "",
    }));
  };

  // Función para guardar un usuario (creación o actualización)
  const handleSave = async () => {
    const token = localStorage.getItem("token");

    if (!editingUser) {
      // Creación de un nuevo usuario
      const userExists = users.some((u) => u.user === formData.user);
      if (userExists) {
        alert("El usuario ya existe");
        return;
      }
      const response = await fetch(`http://localhost:5000/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Se envían los datos necesarios para el registro
        body: JSON.stringify({
          username: formData.user,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        // Agregamos el nuevo usuario a la lista y asumimos que el estado de aprobación es 0
        setUsers((prev) => [
          ...prev,
          { id: data.userId, ...formData, approved: 0 },
        ]);
      }
    } else {
      // Actualización de un usuario existente
      const response = await fetch(
        `http://localhost:5000/api/users/${editingUser}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );
      if (response.ok) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === editingUser
              ? { ...user, ...formData, password: undefined }
              : user
          )
        );
      }
    }
    // Reiniciamos el formulario y dejamos de editar
    setEditingUser(null);
    setFormData({
      user: "",
      email: "",
      role: "",
      password: "",
      firstName: "",
      lastName: "",
      grade: "",
      area: "",
      photo: null,
    });
  };

  // Función para eliminar un usuario
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  // Función para iniciar el proceso de edición y precargar los datos del usuario
  const startEditing = (user) => {
    setEditingUser(user.id);
    setFormData({
      user: user.user,
      email: user.email,
      role: user.role,
      password: "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      grade: user.grade || "",
      area: user.area || "",
      photo: null,
    });
  };

  return (
    <div className={styles.container}>
      <h2>Gestión de Usuarios</h2>

      {/* Campo para buscar usuarios */}
      <input
        type="text"
        placeholder="Buscar usuario..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.searchBar}
      />

      {/* Tabla de usuarios */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.user}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button
                  onClick={() => handleApproveToggle(user.id, user.approved)}
                  className={
                    user.approved === 1
                      ? styles.disapproveButton
                      : styles.approveButton
                  }
                >
                  {user.approved === 1 ? "Desaprobar" : "Aprobar"}
                </button>
              </td>
              <td>
                {editingUser === user.id ? (
                  <>
                    <button onClick={handleSave} className={styles.saveButton}>
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className={styles.cancelButton}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditing(user)}
                      className={styles.editButton}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className={styles.deleteButton}
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Formulario para crear o editar usuario */}
      <div className={styles.editForm}>
        <h3>{editingUser ? "Editar Usuario" : "Crear Usuario"}</h3>
        <form>
          {/* Selección del perfil mediante una lista desplegable */}
          <label>Perfil:</label>
          <select name="role" value={formData.role} onChange={handleRoleChange}>
            <option value="">Seleccione un perfil</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.role}>
                {profile.role}
              </option>
            ))}
          </select>

          <label>Nombre de Usuario:</label>
          <input
            type="text"
            name="user"
            value={formData.user}
            onChange={handleInputChange}
          />

          <label>Email:</label>
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

          {/* Mostrar campos condicionales según el perfil seleccionado */}
          {formData.role === "Estudiante" && (
            <>
              <label>Grado:</label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
              >
                <option value="">Seleccione grado</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
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
                <option value="">Seleccione área</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </>
          )}

          <label>Foto:</label>
          <input type="file" onChange={handleFileChange} />

          <button type="button" onClick={handleSave}>
            {editingUser ? "Guardar Cambios" : "Guardar Usuario"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserManagement;
