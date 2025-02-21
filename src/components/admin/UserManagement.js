import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UserManagement.module.css";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    user: "",
    email: "",
    role: "Estudiante",
    password: "",
    firstName: "",
    lastName: "",
    grade: "",
    area: "",
    photo: null,
  });
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [grades, setGrades] = useState(["Primero", "Segundo", "Tercero"]);
  const [areas, setAreas] = useState(["Matemáticas", "Español", "Geografía"]);

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

  const filteredUsers = users.filter(
    (user) =>
      user.user.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      photo: e.target.files[0],
    }));
  };

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setFormData((prev) => ({
      ...prev,
      role: selectedRole,
      grade: "",
      area: "",
    }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");

    const userExists = users.some((u) => u.user === formData.user);
    if (userExists) {
      alert("El usuario ya existe");
      return;
    }

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

    setEditingUser(null);
    setFormData({
      user: "",
      email: "",
      role: "Estudiante",
      password: "",
      firstName: "",
      lastName: "",
      grade: "",
      area: "",
      photo: null,
    });
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

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
    });
  };

  return (
    <div className={styles.container}>
      <h2>Gestión de Usuarios</h2>

      <input
        type="text"
        placeholder="Buscar usuario..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.searchBar}
      />

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

      <div className={styles.editForm}>
        <h3>Crear Usuario</h3>
        <form>
          <label>Perfil:</label>
          <select name="role" value={formData.role} onChange={handleRoleChange}>
            <option value="Estudiante">Estudiante</option>
            <option value="Educador">Educador</option>
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

          {formData.role === "Estudiante" && (
            <>
              <label>Grado:</label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
              >
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
            Guardar Usuario
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserManagement;
