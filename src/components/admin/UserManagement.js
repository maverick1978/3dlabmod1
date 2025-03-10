import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UserManagement.module.css";

function UserManagement() {
  // Estados para almacenar la lista de usuarios y perfiles (roles)
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);

  // Estado para saber cuál usuario se está editando (si es null, es nuevo)
  const [editingUser, setEditingUser] = useState(null);

  // Estado para los datos del formulario, incluyendo la vista previa de la foto
  const [formData, setFormData] = useState({
    role: "",
    firstName: "",
    lastName: "",
    user: "",
    email: "",
    password: "",
    confirmPassword: "",
    grade: "",
    area: "",
    photo: null,
    photoPreview: "", // Contendrá la URL de la foto actual o la nueva vista previa
  });

  // Estado para el campo de búsqueda y para navegar
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Opciones fijas para grados y áreas
  const [grades] = useState(["Primero", "Segundo", "Tercero"]);
  const [areas] = useState(["Matemáticas", "Español", "Geografía"]);

  // Cargar la lista de usuarios desde el backend cuando se monta el componente
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

  // Cargar los perfiles (roles) desde el backend
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/profiles");
        const data = await response.json();
        setProfiles(data);
      } catch (error) {
        console.error("Error al cargar perfiles:", error);
      }
    };
    fetchProfiles();
  }, []);

  // Filtrar los usuarios según el texto en la barra de búsqueda
  const filteredUsers = users.filter(
    (u) =>
      u.user.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
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
      setUsers((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, approved: newStatus } : user
        )
      );
    }
  };

  // Actualiza el estado del formulario cuando se cambian los inputs de texto
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejo de la subida de archivo (foto)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Guardamos el archivo en el estado
    setFormData((prev) => ({
      ...prev,
      photo: file,
    }));

    // Creamos una vista previa de la imagen usando FileReader
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        photoPreview: reader.result, // Esta es la imagen en base64 para vista previa
      }));
    };
    reader.readAsDataURL(file);
  };

  // Manejo de la selección de perfil desde el dropdown
  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setFormData((prev) => ({
      ...prev,
      role: selectedRole,
      grade: "",
      area: "",
    }));
  };

  // Función para guardar (crear o actualizar) usuario usando FormData
  const handleSave = async () => {
    // Verificamos que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const token = localStorage.getItem("token");
    // Creamos un objeto FormData para enviar datos y archivo
    const formDataToSend = new FormData();
    formDataToSend.append("username", formData.user);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("password", formData.password);
    formDataToSend.append("role", formData.role);
    formDataToSend.append("firstName", formData.firstName);
    formDataToSend.append("lastName", formData.lastName);
    formDataToSend.append("grade", formData.grade);
    formDataToSend.append("area", formData.area);
    if (formData.photo) {
      formDataToSend.append("photo", formData.photo);
    }

    // Si editingUser tiene un valor, estamos en modo edición
    if (editingUser) {
      // Actualización: usamos método PUT al endpoint /api/users/:id
      const response = await fetch(
        `http://localhost:5000/api/users/${editingUser}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataToSend,
        }
      );
      if (response.ok) {
        alert("Usuario actualizado correctamente");
        // Actualizamos la lista de usuarios en el frontend
        setUsers((prev) =>
          prev.map((user) =>
            user.id === editingUser
              ? { ...user, ...formData, password: undefined }
              : user
          )
        );
      } else {
        const err = await response.json();
        alert("Error: " + err.error);
      }
    } else {
      // Creación: se usa el endpoint POST para registrar un nuevo usuario
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setUsers((prev) => [
          ...prev,
          { id: data.userId, ...formData, approved: 0 },
        ]);
      } else {
        const err = await response.json();
        alert("Error: " + err.error);
      }
    }

    // Reiniciamos el formulario
    setEditingUser(null);
    setFormData({
      role: "",
      firstName: "",
      lastName: "",
      user: "",
      email: "",
      password: "",
      confirmPassword: "",
      grade: "",
      area: "",
      photo: null,
      photoPreview: "",
    });
  };

  // Función para eliminar un usuario
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Función para iniciar la edición: carga todos los datos del usuario seleccionado
  const startEditing = (user) => {
    setEditingUser(user.id);
    // Actualizamos el formulario con los datos actuales del usuario
    setFormData({
      role: user.role,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      user: user.user,
      email: user.email,
      password: "",
      confirmPassword: "",
      grade: user.grade || "",
      area: user.area || "",
      photo: null, // No asignamos la foto aquí, se usa si se selecciona una nueva
      // Construimos la URL de la foto para mostrarla en la vista previa
      photoPreview: user.photo
        ? `http://localhost:5000/uploads/${user.photo}`
        : "",
    });
  };

  return (
    <div className={styles.container}>
      <h2>Gestión de Usuarios</h2>

      {/* Barra de búsqueda */}
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
          {filteredUsers.map((u) => (
            <tr key={u.id}>
              <td>{u.user}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button
                  onClick={() => handleApproveToggle(u.id, u.approved)}
                  className={
                    u.approved === 1
                      ? styles.disapproveButton
                      : styles.approveButton
                  }
                >
                  {u.approved === 1 ? "Desaprobar" : "Aprobar"}
                </button>
              </td>
              <td>
                {editingUser === u.id ? (
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
                      onClick={() => startEditing(u)}
                      className={styles.editButton}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
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

      {/* Formulario organizado en dos columnas */}
      <div className={styles.formContainer}>
        <h3>{editingUser ? "Editar Usuario" : "Crear Usuario"}</h3>

        <div className={styles.columns}>
          {/* Columna Izquierda */}
          <div className={styles.leftColumn}>
            <label>Perfil:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleRoleChange}
            >
              <option value="">Seleccione un perfil</option>
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
              name="user"
              value={formData.user}
              onChange={handleInputChange}
            />

            <label>Correo:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />

            <label>Cambio de clav:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
            />

            <label>Repite clav:</label>
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
                <label>Áreas:</label>
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
          </div>

          {/* Columna Derecha */}
          <div className={styles.rightColumn}>
            <label>Cargar Fotografía:</label>
            {formData.photoPreview ? (
              <img
                src={formData.photoPreview}
                alt="Vista previa"
                className={styles.photoPreview}
              />
            ) : (
              <div className={styles.photoPlaceholder}>
                (Sin foto seleccionada)
              </div>
            )}
            <input type="file" onChange={handleFileChange} />

            <button type="button" className={styles.actionButton}>
              Cambiar Fondo
            </button>
            <button type="button" className={styles.actionButton}>
              Mi frase inspiradora
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={styles.saveButtonMain}
            >
              {editingUser ? "Guardar Cambios" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
