const sqlite3 = require("sqlite3").verbose();

// Conexión a la base de datos
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite.");
  }
});

// Crear las tablas en orden
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      password TEXT
    )
    `,
    (err) => {
      if (err) {
        console.error("Error al crear la tabla users:", err.message);
      } else {
        console.log("Tabla users creada o ya existía.");
      }
    }
  );

  db.run(
    `
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      type TEXT DEFAULT 'general'
    )
    `,
    (err) => {
      if (err) {
        console.error("Error al crear la tabla notifications:", err.message);
      } else {
        console.log("Tabla notifications creada o ya existía.");
      }
    }
  );
});

module.exports = db;
