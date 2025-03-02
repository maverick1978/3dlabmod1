import React, { useEffect, useState } from "react";
import CreateUser from "./CreateUser";
import styles from "./UserManagement.module.css";
import axios from "axios";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
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
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
  };
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
      <CreateUser fetchUsers={fetchUsers} />
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
              <div>
                <button onClick={() => setSelectedUser(null)}>
                  Crear Usuario
                </button>
                <CreateUser
                  selectedUser={selectedUser}
                  onUserSaved={fetchUsers}
                />

                <h3>Lista de Usuarios</h3>
                <ul>
                  {users.map((user) => (
                    <li key={user.id}>
                      {user.firstName} {user.lastName} - {user.email}
                      <button onClick={() => handleEditUser(user)}>
                        Editar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagement;
