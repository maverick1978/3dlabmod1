import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UserManagement.module.css";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    user: "",
    email: "",
    role: "",
    password: "",
  });
  const navigate = useNavigate();
  const [search, setSearch] = useState(""); // Estado para la búsqueda

  // Cargar usuarios desde la base de datos
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

  // Filtrar usuarios según la búsqueda
  const filteredUsers = users.filter(
    (user) =>
      user.user.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Aprobar o desaprobar usuario
  const handleApproveToggle = async (id, currentStatus) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === 1 ? 0 : 1; // Cambia el estado

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

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Guardar cambios en el usuario
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/users/${editingUser}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    setUsers((prev) =>
      prev.map((user) =>
        user.id === editingUser
          ? { ...user, ...formData, password: undefined }
          : user
      )
    );

    setEditingUser(null);
    setFormData({ user: "", email: "", role: "", password: "" });
  };

  // Eliminar usuario
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  // Iniciar edición de un usuario
  const startEditing = (user) => {
    setEditingUser(user.id);
    setFormData({
      user: user.user,
      email: user.email,
      role: user.role,
      password: "",
    });
  };

  return (
    <div className={styles.container}>
      <h2>Gestión de Usuarios</h2>

      {/* 🔍 Barra de búsqueda */}
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

      {editingUser && (
        <div className={styles.editForm}>
          <h3>Editar Usuario</h3>
          <form>
            <label>
              Usuario:
              <input
                type="text"
                name="user"
                value={formData.user}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Nueva Contraseña:
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Dejar vacío para no cambiar"
              />
            </label>
            <label>
              Rol:
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="Estudiante">Estudiante</option>
                <option value="Educador">Educador</option>
                <option value="administrador">Administrador</option>
              </select>
            </label>
          </form>
        </div>
      )}

      <button
        className={styles.backButton}
        onClick={() => navigate("/admin/dashboard")}
      >
        Volver al Menú Principal
      </button>
    </div>
  );
}

export default UserManagement;
