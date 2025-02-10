// Importaciones y configuraciones
const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const PORT = 5000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Middleware de roles
const verifyRole = (requiredRole) => (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    if (decoded.role === requiredRole || decoded.role === "admin") {
      req.user = decoded;
      next();
    } else {
      res.status(403).json({ error: "No autorizado" });
    }
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};

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
  CREATE TABLE IF NOT EXISTS class_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  );
`);

  db.run(`
     CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('Estudiante', 'Educador', 'admin')) DEFAULT 'Educador',
    approved INTEGER DEFAULT 0,  -- 0 = Pendiente, 1 = Aprobado
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )

  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    progress INTEGER DEFAULT 0
    )
  `);

  // Agregar tabla de clases
  db.run(`
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    grade TEXT NOT NULL,
    educator_id INTEGER,
    FOREIGN KEY (educator_id) REFERENCES users(id) ON DELETE SET NULL
  )
`);

  db.run(
    `
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    type TEXT DEFAULT 'general',
    message TEXT DEFAULT 'Mensaje por defecto',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `,
    (err) => {
      if (!err) {
        console.log("Tabla 'notifications' creada correctamente.");
        seedNotifications(); // Ejecutar el seed solo después de crear las tablas
      } else {
        console.error("Error al crear la tabla 'notifications':", err.message);
      }
    }
  );
};

// Seed inicial para notificaciones y creación del administrador
const seedNotifications = async () => {
  const query = `INSERT INTO notifications (title, detail, read, TYPE) VALUES (?, ?, ?, ?)`;
  const insertStudentsQuery =
    "INSERT INTO students (name, progress) VALUES (?, ?)";

  // Generar la contraseña encriptada para el administrador
  const adminUser = "admin";
  const adminEmail = "admin@example.com";
  const adminPassword = await bcrypt.hash("admin123", 10); // Contraseña encriptada
  const adminRole = "admin";

  db.serialize(() => {
    // Notificaciones iniciales
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

    // Estudiantes iniciales
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

    // Crear el usuario administrador si no existe
    db.get(
      "SELECT * FROM users WHERE user = ? OR email = ?",
      [adminUser, adminEmail],
      (err, user) => {
        if (err) {
          console.error("Error al verificar el administrador:", err.message);
        } else if (!user) {
          db.run(
            "INSERT INTO users (user, email, password, role) VALUES (?, ?, ?, ?)",
            [adminUser, adminEmail, adminPassword, adminRole],
            (err) => {
              if (err) {
                console.error("Error al crear el administrador:", err.message);
              } else {
                console.log("Administrador creado exitosamente.");
              }
            }
          );
        } else {
          console.log("El administrador ya existe.");
        }
      }
    );
  });
};

// Crear tablas y seed inicial
createTables();
// Endpoint Registrar usuario
app.post("/api/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (user, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role || "user"],
      function (err) {
        if (err) {
          res.status(400).json({
            error: "Error al registrar usuario: " + err.message,
          });
        } else {
          res.status(201).json({
            id: this.lastID,
            username,
            email,
            role: role || "user",
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Error del servidor al registrar usuario" });
  }
});

// Endpoint Iniciar sesión
// Endpoint Iniciar sesión
app.post("/api/login", async (req, res) => {
  const { user, password } = req.body;

  // Verificar si se trata de un usuario "admin" con credenciales predeterminadas
  if (user === "admin" && password === "admin123") {
    const token = jwt.sign({ user: user, role: "admin" }, "SECRET_KEY", {
      expiresIn: "1h",
    });
    return res.status(200).json({
      message: "Inicio de sesión exitoso (admin)",
      token,
      user: user,
    });
  }

  // Consultar en la base de datos por username o email
  db.get(
    "SELECT * FROM users WHERE user = ? OR email = ?",
    [user, user],
    async (err, userRow) => {
      if (err) {
        return res.status(500).json({ error: "Error al buscar usuario" });
      }
      if (!userRow) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Si el usuario no está aprobado, rechazar el login
      if (userRow.approved === 0) {
        return res
          .status(403)
          .json({ error: "Cuenta pendiente de aprobación" });
      }

      // Verificar contraseña
      const isValid = await bcrypt.compare(password, userRow.password);

      if (isValid) {
        const token = jwt.sign(
          { id: userRow.id, role: userRow.role },
          "SECRET_KEY",
          { expiresIn: "1h" }
        );
        return res.status(200).json({
          message: "Inicio de sesión exitoso",
          token,
          user: userRow.user,
          role: userRow.role,
        });
      } else {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }
    }
  );
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

// Crear una notificación
app.post("/api/notifications", (req, res) => {
  const { title, detail, type = "general", message } = req.body;

  db.run(
    `INSERT INTO notifications (title, detail, type, message) VALUES (?, ?, ?, ?)`,
    [title, detail, type, message],
    function (err) {
      if (err) {
        res.status(500).json({ error: "Error al crear la notificación" });
        console.error(err.message);
      } else {
        res.status(201).json({
          id: this.lastID,
          title,
          detail,
          type,
          message,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );
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

// Eliminar notificación por ID

app.delete("/api/notifications/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM notifications WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: "Error al eliminar la notificación." });
    } else {
      res.status(200).json({ message: "Notificación eliminada con éxito." });
      io.emit("notification-deleted", id); // Enviar evento de eliminación a través de socket.io
    }
  });
});

/* 
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.status(200).json({ message: "Notificación eliminada con éxito." });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la notificación." });
  }
});
 */
// Notificaciones en tiempo real
io.on("connection", (socket) => {
  console.log("Cliente conectado");

  // Manejo de eventos personalizados
  socket.on("example-event", (data) => {
    console.log("Evento recibido:", data);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });

  // Endpoint para eliminar notificación por ID
  app.delete("/api/notifications/:id", (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM notifications WHERE id = ?", [id], function (err) {
      if (err) {
        res.status(500).json({ error: "Error al eliminar la notificación." });
      } else {
        res.status(200).json({ message: "Notificación eliminada con éxito." });
        io.emit("notification-deleted", id); // Enviar evento de eliminación a través de socket.io
      }
    });
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

app.get("/api/students/:id/history", (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT classes.name, class_assignments.assigned_at
    FROM class_assignments
    INNER JOIN classes ON class_assignments.class_id = classes.id
    WHERE class_assignments.student_id = ?
    ORDER BY assigned_at DESC;
  `;

  db.all(query, [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener historial" });
    } else {
      res.json(rows);
    }
  });
});

app.get("/api/users", verifyRole("admin"), (req, res) => {
  db.all(
    "SELECT id, user, email, role, approved FROM users",
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: "Error al obtener los usuarios" });
      } else {
        res.json(rows);
      }
    }
  );
});

app.put("/api/users/:id", verifyRole("admin"), (req, res) => {
  const { id } = req.params;
  const { user, email, role, password } = req.body;

  let query = "UPDATE users SET user = ?, email = ?, role = ?";
  const params = [user, email, role, id];

  // Si se proporciona una nueva contraseña, incluirla en la consulta
  if (password) {
    query += ", password = ?";
    params.splice(3, 0, bcrypt.hashSync(password, 10)); // Inserta la contraseña encriptada
  }

  query += " WHERE id = ?";

  db.run(query, params, function (err) {
    if (err) {
      res.status(500).json({ error: "Error al actualizar el usuario" });
    } else {
      res.json({ message: "Usuario actualizado correctamente" });
    }
  });
});

app.delete("/api/users/:id", verifyRole("admin"), (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: "Error al eliminar el usuario" });
    } else {
      res.json({ message: "Usuario eliminado correctamente" });
    }
  });
});

app.put("/api/users/:id/approve", verifyRole("admin"), (req, res) => {
  const { id } = req.params;
  const { approved } = req.body; // Recibir si queremos aprobar (1) o desaprobar (0)

  db.run(
    "UPDATE users SET approved = ? WHERE id = ?",
    [approved, id],
    function (err) {
      if (err) {
        res
          .status(500)
          .json({ error: "Error al actualizar el estado de aprobación" });
      } else {
        res.json({
          message: "Estado de usuario actualizado correctamente",
          approved,
        });
      }
    }
  );
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

app.post("/api/assign-student", (req, res) => {
  const { classId, studentId } = req.body;

  db.run(
    "INSERT INTO class_students (class_id, student_id) VALUES (?, ?)",
    [classId, studentId],
    (err) => {
      if (err) {
        res.status(500).json({ error: "Error al asignar estudiante" });
      } else {
        res.json({ message: "Estudiante asignado correctamente" });
      }
    }
  );
});
// Ruta protegida para el AdminDashboard
app.get("/api/admin/dashboard", verifyRole("admin"), (req, res) => {
  res.status(200).json({
    message: "Bienvenido al AdminDashboard",
    user: req.user, // Información del usuario decodificada desde el token
  });
});
app.get("/api/admin/stats", verifyRole("admin"), (req, res) => {
  const queryUsers = "SELECT COUNT(*) AS totalUsers FROM users";
  const queryPendingTasks =
    "SELECT COUNT(*) AS pendingTasks FROM tasks WHERE status = 'Pendiente'";
  const queryClasses = "SELECT COUNT(*) AS totalClasses FROM classes";
  const queryCompletedTasks =
    "SELECT COUNT(*) AS completedTasks FROM tasks WHERE status = 'Completada'";
  const queryReports = "SELECT COUNT(*) AS totalReports FROM reports";

  db.serialize(() => {
    db.get(queryUsers, (err, usersResult) => {
      db.get(queryPendingTasks, (err, pendingTasksResult) => {
        db.get(queryClasses, (err, classesResult) => {
          db.get(queryCompletedTasks, (err, completedTasksResult) => {
            db.get(queryReports, (err, reportsResult) => {
              res.json({
                totalUsers: usersResult?.totalUsers || 0,
                pendingTasks: pendingTasksResult?.pendingTasks || 0,
                totalClasses: classesResult?.totalClasses || 0,
                completedTasks: completedTasksResult?.completedTasks || 0,
                totalReports: reportsResult?.totalReports || 0,
              });
            });
          });
        });
      });
    });
  });
});
// Crear una nueva tarea
app.post("/api/tasks", (req, res) => {
  const { title, description, status, date } = req.body;

  // Normalizar la fecha para eliminar problemas de zonas horarias
  const normalizedDate = date
    ? new Date(date).toISOString().split("T")[0]
    : null;

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

// Agregar tabla de clases
db.run(`
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    educator_id INTEGER,
    FOREIGN KEY (educator_id) REFERENCES users(id)
  )
`);

// Endpoint para crear una clase
app.post("/api/classes", verifyRole("admin"), (req, res) => {
  const { name, grade, educator_id } = req.body;

  db.run(
    "INSERT INTO classes (name, grade, educator_id) VALUES (?, ?, ?)",
    [name, grade, educator_id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error al crear la clase" });
      }
      res.status(201).json({ id: this.lastID, name, grade, educator_id });
    }
  );
});

// Endpoint para obtener todas las clases
app.get("/api/classes", (req, res) => {
  const query = `
    SELECT classes.id, classes.name, users.user AS student
    FROM class_assignments
    INNER JOIN classes ON class_assignments.class_id = classes.id
    INNER JOIN users ON class_assignments.student_id = users.id;
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Error al obtener clases y asignaciones" });
    } else {
      res.json(rows);
    }
  });
});

app.post("/api/classes/assign", (req, res) => {
  const { class_id, student_id } = req.body;

  db.run(
    "INSERT INTO class_assignments (class_id, student_id) VALUES (?, ?)",
    [class_id, student_id],
    function (err) {
      if (err) {
        res.status(500).json({ error: "Error al asignar estudiante" });
      } else {
        res.status(201).json({ message: "Estudiante asignado con éxito" });
      }
    }
  );
});

app.put("/api/classes/update", (req, res) => {
  const { id, new_class_id } = req.body;

  db.run(
    "UPDATE class_assignments SET class_id = ? WHERE id = ?",
    [new_class_id, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: "Error al actualizar asignación" });
      } else {
        res.json({ message: "Asignación actualizada con éxito" });
      }
    }
  );
});

app.delete("/api/classes/remove/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM class_assignments WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: "Error al eliminar asignación" });
    } else {
      res.json({ message: "Asignación eliminada con éxito" });
    }
  });
});

app.post("/api/classes", verifyRole("admin"), (req, res) => {
  const { name, grade, educator_id } = req.body;

  db.run(
    "INSERT INTO classes (name, grade, educator_id) VALUES (?, ?, ?)",
    [name, grade, educator_id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error al crear la clase" });
      }
      res.status(201).json({ id: this.lastID, name, grade, educator_id });
    }
  );
});

// Endpoint para actualizar una clase
app.put("/api/classes/:id", verifyRole("admin"), (req, res) => {
  const { id } = req.params;
  const { name, grade, educator_id } = req.body;

  db.run(
    "UPDATE classes SET name = ?, grade = ?, educator_id = ? WHERE id = ?",
    [name, grade, educator_id, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error al actualizar la clase" });
      }

      // Obtener la clase actualizada y devolverla
      db.get(
        "SELECT * FROM classes WHERE id = ?",
        [id],
        (err, updatedClass) => {
          if (err) {
            return res
              .status(500)
              .json({ error: "Error al obtener la clase actualizada" });
          }
          res.json(updatedClass);
        }
      );
    }
  );
});

// Endpoint para eliminar una clase
app.delete("/api/classes/:id", verifyRole("admin"), (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM classes WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al eliminar la clase" });
    }
    res.json({ message: "Clase eliminada correctamente" });
  });
});
// Obtener estudiantes sin asignar
app.get("/api/students/unassigned", (req, res) => {
  db.all(
    `SELECT id, user FROM users WHERE role = 'Estudiante' 
     AND id NOT IN (SELECT student_id FROM class_assignments)`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: "Error al obtener estudiantes" });
      } else {
        res.json(rows);
      }
    }
  );
});

// Asignar un estudiante a una clase
app.post("/api/assign-student", (req, res) => {
  const { classId, studentId } = req.body;

  db.run(
    "INSERT INTO class_assignments (class_id, student_id) VALUES (?, ?)",
    [classId, studentId],
    (err) => {
      if (err) {
        res.status(500).json({ error: "Error al asignar estudiante" });
      } else {
        res.json({ message: "Estudiante asignado correctamente" });
      }
    }
  );
});

// Obtener lista de estudiantes en una clase específica
app.get("/api/classes/:id/students", (req, res) => {
  const { id } = req.params;

  db.all(
    `SELECT u.id, u.user FROM users u
     JOIN class_assignments ca ON u.id = ca.student_id
     WHERE ca.class_id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        res
          .status(500)
          .json({ error: "Error al obtener estudiantes de la clase" });
      } else {
        res.json(rows);
      }
    }
  );
});

// Endpoint para asignar estudiantes a una clase
app.post("/api/classes/:classId/students", verifyRole("admin"), (req, res) => {
  const { classId } = req.params;
  const { student_id } = req.body;

  db.run(
    "INSERT INTO class_students (class_id, student_id) VALUES (?, ?)",
    [classId, student_id],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al asignar estudiante a la clase" });
      }
      res.json({ message: "Estudiante asignado correctamente" });
    }
  );
});

// Endpoint para obtener los estudiantes de una clase
app.get("/api/classes/:classId/students", verifyRole("admin"), (req, res) => {
  const { classId } = req.params;

  db.all(
    `SELECT users.id, users.user, users.email 
     FROM users 
     JOIN class_students ON users.id = class_students.student_id
     WHERE class_students.class_id = ?`,
    [classId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Error al obtener estudiantes" });
      }
      res.json(rows);
    }
  );
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
