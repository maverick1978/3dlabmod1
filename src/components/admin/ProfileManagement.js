import React, { useState, useEffect } from "react";
import styles from "./ProfileManagement.module.css";

function ProfileManagement() {
  const [profiles, setProfiles] = useState([]);
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileUsers, setProfileUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Obtener perfiles
  const fetchProfiles = async () => {
    const response = await fetch("http://localhost:5000/api/profiles");
    const data = await response.json();
    setProfiles(data);
  };

  // Crear un nuevo perfil
  const handleCreateProfile = async () => {
    if (!role || !description) {
      alert("Por favor, completa todos los campos");
      return;
    }

    const response = await fetch("http://localhost:5000/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, description }),
    });

    if (response.ok) {
      alert("Perfil creado correctamente");
      setRole("");
      setDescription("");
      fetchProfiles(); // Actualizar la lista de perfiles
    } else {
      alert("Error al crear el perfil");
    }
  };

  // Obtener usuarios de un perfil
  const handleProfileClick = async (role) => {
    setSelectedProfile(role);
    setShowPopup(true);

    const response = await fetch(
      `http://localhost:5000/api/profiles/${role}/users`
    );
    const data = await response.json();
    setProfileUsers(data);
  };

  // Eliminar perfil si no tiene usuarios asociados
  const handleDeleteProfile = async (profileId) => {
    const response = await fetch(
      `http://localhost:5000/api/profiles/${profileId}/check-users`
    );

    if (!response.ok) {
      alert("Error al verificar usuarios.");
      return;
    }

    const { userCount } = await response.json();

    if (userCount > 0) {
      alert("No se puede eliminar el perfil porque tiene usuarios asignados.");
      return;
    }

    const deleteResponse = await fetch(
      `http://localhost:5000/api/profiles/${profileId}`,
      {
        method: "DELETE",
      }
    );

    if (deleteResponse.ok) {
      alert("Perfil eliminado correctamente.");
      fetchProfiles();
    } else {
      alert("Error al eliminar el perfil.");
    }
  };

  return (
    <div className={styles.profileContainer}>
      <h2>Gestión de Perfiles</h2>

      {/* Formulario para crear perfil */}
      <div className={styles.formGroup}>
        <input
          type="text"
          placeholder="Nombre del Perfil"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={styles.inputField}
        />
        <input
          type="text"
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.inputField}
        />
        <button onClick={handleCreateProfile} className={styles.createButton}>
          Crear Perfil
        </button>
      </div>

      {/* Lista de perfiles */}
      <ul className={styles.profileList}>
        {profiles.map((profile) => (
          <li key={profile.id} className={styles.profileItem}>
            <div
              onClick={() => handleProfileClick(profile.role)}
              className={styles.clickable}
            >
              <strong>{profile.role}</strong>
              <p>{profile.description}</p>
            </div>

            {/* Botón para eliminar perfil si no es fijo */}
            {!["Administrador", "Educador", "Estudiante"].includes(
              profile.role
            ) && (
              <button
                onClick={() => handleDeleteProfile(profile.id)}
                className={styles.deleteButton}
              >
                Eliminar
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Popup con la lista de usuarios */}
      {showPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3>Usuarios con perfil: {selectedProfile}</h3>
            <ul>
              {profileUsers.length > 0 ? (
                profileUsers.map((user) => (
                  <li key={user.id}>
                    {user.user} - {user.email}
                  </li>
                ))
              ) : (
                <p>No hay usuarios en este perfil.</p>
              )}
            </ul>
            <button onClick={() => setShowPopup(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileManagement;
