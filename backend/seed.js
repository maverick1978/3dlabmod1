const sqlite3 = require("sqlite3").verbose();

// Abrir la conexión a la base de datos
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err.message);
    return;
  }
  console.log("Conectado a la base de datos SQLite.");
});

// Ejecutar las consultas para insertar los datos iniciales
db.serialize(() => {
  db.run(
    `
    INSERT INTO notifications (title, detail, read, type) VALUES
    ('Nueva tarea asignada', 'Revisar la tarea de matemáticas.', 0, 'Tareas'),
    ('Mensaje del administrador', 'El sistema se actualizará mañana.', 1, 'Mensajes'),
    ('Calificación publicada', 'Ya puedes revisar tu última calificación.', 0, 'Calificaciones')
    `,
    (err) => {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          console.log("Las notificaciones ya están insertadas.");
        } else {
          console.error("Error al insertar notificaciones:", err.message);
        }
      } else {
        console.log("Notificaciones insertadas correctamente.");
      }
    }
  );

  db.run(
    `
    INSERT INTO students (name, progress) VALUES
    ('Juan Pérez', 80),
    ('María López', 60),
    ('Carlos García', 90)
    `,
    (err) => {
      if (err) {
        console.error("Error al insertar estudiantes:", err.message);
      } else {
        console.log("Estudiantes insertados correctamente.");
      }
      db.close(); // Cerrar la conexión después de ejecutar las consultas
    }
  );
});
