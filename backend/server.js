const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Conexión a la base de datos
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite.");
  }
});

// Crear tablas si no existen
const createTables = () => {
  // Crear la tabla de tareas si no existe
  db.run(
    `
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendiente',
    date TEXT DEFAULT ''
  )
`,
    (err) => {
      if (err) {
        console.error("Error al crear la tabla de tareas:", err.message);
      } else {
        console.log('Tabla "tasks" creada o ya existente.');
      }
    }
  );

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      password TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    progress INTEGER DEFAULT 0
    )
  `);

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
      if (!err) {
        console.log("Tablas creadas correctamente.");
        seedNotifications(); // Ejecutar el seed solo después de crear las tablas
      } else {
        console.error("Error al crear las tablas:", err.message);
      }
    }
  );
};

// Seed inicial para notificaciones
const seedNotifications = () => {
  const query = `INSERT INTO notifications (title, detail, read, TYPE) VALUES (?, ?, ?,?)`;
  const insertStudentsQuery =
    "INSERT INTO students (name, progress) VALUES (?, ?)";

  db.serialize(() => {
    db.run(query, [
      "Nueva tarea asignada",
      "Revisar la tarea de matemáticas.",
      0,
      "Tareas",
    ]);
    db.run(query, [
      "Mensaje del administrador",
      "El sistema se actualizará mañana.",
      1,
      "Mensajes",
    ]);
    db.run(
      query,
      [
        "Calificación publicada",
        "Ya puedes revisar tu última calificación.",
        0,
        "Calificaciones",
      ],
      (err) => {
        if (!err) {
          console.log("Notificaciones iniciales creadas.");
        } else {
          console.error(
            "Error al insertar notificaciones iniciales:",
            err.message
          );
        }
      }
    );
    db.run(insertStudentsQuery, ["Juan Pérez", 80], (err) => {
      if (err) {
        console.error("Error al insertar estudiante Juan Pérez:", err.message);
      }
    });
    db.run(insertStudentsQuery, ["María López", 60], (err) => {
      if (err) {
        console.error("Error al insertar estudiante María López:", err.message);
      }
    });
    db.run(insertStudentsQuery, ["Carlos García", 90], (err) => {
      if (err) {
        console.error(
          "Error al insertar estudiante Carlos García:",
          err.message
        );
      } else {
        console.log("Estudiantes insertados correctamente.");
      }
    });
  });
};

// Crear tablas y seed inicial
createTables();

// Endpoint para registrar usuarios
app.post("/register", async (req, res) => {
  const { name, email, username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO users (name, email, username, password) VALUES (?, ?, ?, ?)`;
    db.run(query, [name, email, username, hashedPassword], function (err) {
      if (err) {
        res
          .status(400)
          .json({ error: "Error al registrar usuario: " + err.message });
      } else {
        res.json({
          message: "Usuario registrado con éxito",
          userId: this.lastID,
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Error al encriptar la contraseña" });
  }
});

// Endpoint para login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = ?`;
  db.get(query, [username], async (err, row) => {
    if (err) {
      res
        .status(500)
        .json({ error: "Error en la base de datos: " + err.message });
    } else if (row && (await bcrypt.compare(password, row.password))) {
      res.json({ message: "Inicio de sesión exitoso", user: row });
    } else {
      res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }
  });
});

// Endpoint para obtener todas las notificaciones
app.get("/api/notifications", (req, res) => {
  const { type } = req.query; // Filtrar por tipo si es necesario
  const query = type
    ? "SELECT * FROM notifications WHERE type = ?"
    : "SELECT * FROM notifications";

  db.all(query, type ? [type] : [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener las notificaciones" });
    } else {
      res.json(rows);
    }
  });
});

// Endpoint para marcar una notificación como leída
app.post("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  db.run(
    "UPDATE notifications SET read = 1 WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        res.status(500).json({ error: "Error al actualizar la notificación" });
      } else {
        res.json({ message: "Notificación marcada como leída" });
      }
    }
  );
});

// Notificaciones en tiempo real
io.on("connection", (socket) => {
  console.log("Cliente conectado");

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });

  // Evento para enviar nuevas notificaciones
  socket.on("new-notification", (notification) => {
    const query = `INSERT INTO notifications (title, detail, read) VALUES (?, ?, 0)`;
    db.run(query, [notification.title, notification.detail], function (err) {
      if (!err) {
        io.emit("new-notification", {
          id: this.lastID,
          ...notification,
          read: 0,
        });
      }
    });
  });
});

// Obtener lista de estudiantes
app.get("/api/students", (req, res) => {
  db.all("SELECT * FROM students", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener estudiantes" });
    } else {
      res.json(rows);
    }
  });
});

// Enviar una recomendación a un estudiante
app.post("/api/students/:id/recommendation", (req, res) => {
  const { id } = req.params;
  const { recommendation } = req.body;

  console.log(`Recomendación para estudiante ${id}:`, recommendation);
  res.json({ message: "Recomendación enviada." });
});

// Obtener tareas con filtro por estado
app.get("/api/tasks", (req, res) => {
  const { status } = req.query; // Recibe el estado como parámetro
  const query = status
    ? "SELECT * FROM tasks WHERE status = ?"
    : "SELECT * FROM tasks";

  db.all(query, status ? [status] : [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener tareas" });
    } else {
      res.json(rows);
    }
  });
});

// Crear una nueva tarea
app.post("/api/tasks", (req, res) => {
  const { title, description, status, date } = req.body;

  // Normalizar la fecha para eliminar problemas de zonas horarias
  const normalizedDate = new Date(date).toISOString().split("T")[0];

  db.run(
    "INSERT INTO tasks (title, description, status, date) VALUES (?, ?, ?, ?)",
    [title, description, status, normalizedDate],
    function (err) {
      if (err) {
        res.status(500).json({ error: "Error al crear la tarea" });
      } else {
        res.json({
          id: this.lastID,
          title,
          description,
          status,
          date: normalizedDate,
        });
      }
    }
  );
});

// Actualizar una tarea
app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, status, date } = req.body;

  // Normalizar la fecha
  const normalizedDate = new Date(date).toISOString().split("T")[0];

  db.run(
    "UPDATE tasks SET title = ?, description = ?, status = ?, date = ? WHERE id = ?",
    [title, description, status, normalizedDate, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: "Error al actualizar la tarea" });
      } else {
        res.json({ id, title, description, status, date: normalizedDate });
      }
    }
  );
});

// Eliminar una tarea
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: "Error al eliminar la tarea" });
    } else {
      res.json({ message: "Tarea eliminada correctamente" });
    }
  });
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
