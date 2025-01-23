import React, { useEffect, useState } from "react";
import styles from "./UserManagement.module.css";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null); // Usuario en edición
  const [formData, setFormData] = useState({
    user: "",
    email: "",
    role: "",
    password: "",
  });

  // Cargar usuarios desde el backend
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
          ? { ...user, ...formData, password: undefined } // No actualizar la contraseña en el frontend
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
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.user}</td>
              <td>{user.email}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) =>
                    handleInputChange({
                      target: { name: "role", value: e.target.value },
                    })
                  }
                  disabled={editingUser !== user.id}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
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
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
          </form>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
