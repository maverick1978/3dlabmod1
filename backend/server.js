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
const multer = require("multer");

// Middleware de roles
const verifyRole = (requiredRole) => (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    if (decoded.role === requiredRole || decoded.role === "Administrador") {
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
  db.run(
    `
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL
        )
    `,
    () => {
      // Insertar roles predeterminados si no existen
      db.run(`
            INSERT OR IGNORE INTO profile (role, description) VALUES 
            ('Administrador', 'Perfil con acceso total al sistema'),
            ('Educador', 'Perfil con permisos para gestionar clases y tareas'),
            ('Estudiante', 'Perfil con acceso limitado para visualizar tareas y clases')
        `);
    }
  );

  db.run(
    `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT,  -- Cambio: ahora es TEXT para guardar el nombre del perfil
    firstName TEXT,
    lastName TEXT,
    grade TEXT,
    area TEXT,
    photo TEXT,
    approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `
  );

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

  `);

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

// Configuramos cómo y dónde se guardarán las imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Guardaremos las imágenes en la carpeta "uploads"
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Creamos un nombre único para evitar que se sobrescriban archivos
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
app.use("/uploads", express.static("uploads"));

// Creamos la función "upload" que usaremos en nuestro endpoint
const upload = multer({ storage: storage });
// Seed inicial para notificaciones y creación del admin
const seedNotifications = async () => {
  const query = `INSERT INTO notifications (title, detail, read, TYPE) VALUES (?, ?, ?, ?)`;
  const insertStudentsQuery =
    "INSERT INTO students (name, progress) VALUES (?, ?)";

  // Generar la contraseña encriptada para el admin
  const adminUser = "Administrador";
  const adminEmail = "admin@example.com";
  const adminPassword = await bcrypt.hash("admin123", 10); // Contraseña encriptada
  const adminRole = "Administrador";

  db.serialize(() => {
    // Crear el usuario admin si no existe
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
// Modificar el registro de usuarios para usar perfiles de la tabla profile
app.post("/api/register", upload.single("photo"), async (req, res) => {
  try {
    console.log("Datos recibidos (req.body):", req.body);
    console.log("Archivo recibido (req.file):", req.file);

    // Extraemos los campos del formulario
    const {
      username,
      email,
      password,
      role,
      firstName,
      lastName,
      grade,
      area,
    } = req.body;
    // Si se envió una foto, guardamos su nombre; de lo contrario, null
    const photoFileName = req.file ? req.file.filename : null;

    // Validamos que los datos obligatorios estén presentes
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Verificamos que el rol exista en la tabla "profile" (se consulta por el nombre)
    db.get("SELECT role FROM profile WHERE role = ?", [role], (err, row) => {
      if (err) {
        console.error("Error al buscar perfil:", err);
        return res.status(500).json({ error: "Error al buscar perfil" });
      }
      if (!row) {
        return res
          .status(400)
          .json({ error: "El perfil seleccionado no existe" });
      }

      // Encriptamos la contraseña
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          console.error("Error al encriptar contraseña:", err);
          return res
            .status(500)
            .json({ error: "Error al encriptar contraseña" });
        }

        // Insertamos todos los datos en la tabla "users"
        db.run(
          `
          INSERT INTO users (user, email, password, role, firstName, lastName, grade, area, photo, approved)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
          `,
          [
            username,
            email,
            hash,
            role,
            firstName,
            lastName,
            grade,
            area,
            photoFileName,
          ],
          function (err) {
            if (err) {
              console.error("Error al insertar en la BD:", err);
              return res
                .status(500)
                .json({ error: "Error al registrar usuario" });
            }
            // Responde con un mensaje de confirmación y el ID del usuario creado
            res.status(201).json({
              message: "Usuario registrado correctamente",
              userId: this.lastID,
            });
          }
        );
      });
    });
  } catch (error) {
    console.error("Error en /api/register:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/// Verificar si un perfil tiene usuarios antes de eliminarlo
app.get("/api/profiles/:id/check-users", (req, res) => {
  const profileId = req.params.id;

  db.get(
    "SELECT COUNT(*) AS count FROM users WHERE role = ?",
    [profileId],
    (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al verificar usuarios en este perfil" });
      }
      res.json({ userCount: row.count });
    }
  );
});

// Eliminar un perfil solo si no tiene usuarios asociados
app.delete("/api/profiles/:id", (req, res) => {
  const profileId = req.params.id;

  db.get(
    "SELECT COUNT(*) AS count FROM users WHERE role = ?",
    [profileId],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          error: "Error al verificar usuarios antes de eliminar el perfil",
        });
      }

      if (row.count > 0) {
        return res.status(400).json({
          error: "No se puede eliminar un perfil con usuarios asociados",
        });
      }

      db.run("DELETE FROM profile WHERE id = ?", [profileId], function (err) {
        if (err) {
          return res.status(500).json({ error: "Error al eliminar el perfil" });
        }
        res.json({ message: "Perfil eliminado correctamente" });
      });
    }
  );
});

// Endpoint para crear un nuevo perfil desde AdminDashboard
app.post("/api/profiles", (req, res) => {
  const { role, description } = req.body;

  if (!role || !description) {
    return res
      .status(400)
      .json({ error: "Se requieren el nombre y la descripción del perfil" });
  }

  if (["Administrador", "Educador", "Estudiante"].includes(role)) {
    return res
      .status(400)
      .json({ error: "No se pueden modificar los perfiles predeterminados" });
  }

  db.run(
    "INSERT INTO profile (role, description) VALUES (?, ?)",
    [role, description],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al crear perfil" });

      res.json({
        message: "Perfil creado correctamente",
        profileId: this.lastID,
      });
    }
  );
});

// Endpoint para obtener todos los perfiles
app.get("/api/profiles", (req, res) => {
  db.all("SELECT * FROM profile", [], (err, rows) => {
    if (err)
      return res.status(500).json({ error: "Error al obtener perfiles" });

    res.json(rows);
  });
});

// Obtener usuarios asociados a un perfil específico
app.get("/api/profiles/:role/users", (req, res) => {
  const { role } = req.params;

  db.all(
    "SELECT id, user, email FROM users WHERE role = ?",
    [role],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Error en la consulta" });
      res.json(rows);
    }
  );
});

// Endpoint Iniciar sesión
app.post("/api/login", async (req, res) => {
  const { user, password } = req.body;

  // Verificar si se trata de un usuario "admin" con credenciales predeterminadas
  if (user === "Administrador" && password === "admin123") {
    const token = jwt.sign(
      { user: user, role: "Administrador" },
      "SECRET_KEY",
      {
        expiresIn: "1h",
      }
    );
    return res.status(200).json({
      message: "Inicio de sesión exitoso (Administrador)",
      token,
      user: user,
      role: "Administrador",
    });
  }

  // Consultar en la base de datos por username o email con JOIN a profile
  db.get(
    `SELECT users.*, profile.role as role_name 
   FROM users 
   LEFT JOIN profile ON users.role = profile.id 
   WHERE users.user = ? OR users.email = ?`,
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
      if (!isValid) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Generar token con el rol correcto
      const token = jwt.sign(
        { id: userRow.id, role: userRow.role_name || userRow.role },
        "SECRET_KEY",
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        message: "Inicio de sesión exitoso",
        token,
        user: userRow.user,
        role: userRow.role_name || userRow.role,
      });
    }
  );
});

// Crear un nuevo perfil (incluyendo la creación de perfiles predeterminados si no existen)
app.post("/profiles", (req, res) => {
  const { role, description } = req.body;

  // Crear perfiles predeterminados si no existen
  const defaultProfiles = [
    { role: "Administrador", description: "Perfil con todos los permisos" },
    { role: "Educador", description: "Perfil con permisos de enseñanza" },
    { role: "Estudiante", description: "Perfil con permisos de aprendizaje" },
  ];

  defaultProfiles.forEach(({ role, description }) => {
    db.run("INSERT OR IGNORE INTO profile (role, description) VALUES (?, ?)", [
      role,
      description,
    ]);
  });

  // Evitar modificar perfiles predeterminados
  if (["Administrador", "Educador", "Estudiante"].includes(role)) {
    return res.status(400).json({
      error: "No se puede modificar perfiles predeterminados",
    });
  }

  // Insertar nuevo perfil
  db.run(
    "INSERT INTO profile (role, description) VALUES (?, ?)",
    [role, description],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        profileId: this.lastID,
        message: "Perfil creado correctamente",
      });
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
  db.all("SELECT * FROM users WHERE role = 'Estudiante'", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener estudiantes" });
    }
    res.json(rows);
  });
});

app.get("/api/users", verifyRole("Administrador"), (req, res) => {
  // Se realiza un LEFT JOIN entre la tabla "users" y "profile"
  // para obtener el nombre del perfil (profile.role) en lugar del ID.
  const query = `
    SELECT 
      users.id, 
      users.user, 
      users.email, 
      profile.role AS role, 
      users.approved,
      users.firstName,
      users.lastName,
      users.grade,
      users.area,
      users.photo,
      users.created_at
    FROM users
    LEFT JOIN profile ON users.role = profile.role
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener los usuarios:", err);
      return res.status(500).json({ error: "Error al obtener los usuarios" });
    }
    res.json(rows);
  });
});

// Endpoint para actualizar un usuario (incluye actualización de foto si se envía)
app.put(
  "/api/users/:id",
  upload.single("photo"),
  verifyRole("Administrador"),
  (req, res) => {
    const { id } = req.params;
    // Cuando se usa multer, los datos vienen en req.body y si se envía una foto, en req.file
    const { user, email, role, password, firstName, lastName, grade, area } =
      req.body;
    // Si se envió un archivo, guardamos su nombre
    const photoFileName = req.file ? req.file.filename : null;

    // Comenzamos la construcción de la consulta UPDATE
    let query = `
    UPDATE users 
    SET user = ?, email = ?, role = ?, firstName = ?, lastName = ?, grade = ?, area = ?
  `;
    const params = [user, email, role, firstName, lastName, grade, area];

    // Solo actualizamos la contraseña si se envió una nueva
    if (password && password.trim() !== "") {
      query += ", password = ?";
      params.push(bcrypt.hashSync(password, 10));
    }

    // Actualizamos la foto si se ha enviado una nueva
    if (photoFileName) {
      query += ", photo = ?";
      params.push(photoFileName);
    }

    query += " WHERE id = ?";
    params.push(id);

    db.run(query, params, function (err) {
      if (err) {
        console.error("Error al actualizar usuario:", err);
        return res
          .status(500)
          .json({ error: "Error al actualizar el usuario" });
      }
      res.json({ message: "Usuario actualizado correctamente" });
    });
  }
);

app.delete("/api/users/:id", verifyRole("Administrador"), (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: "Error al eliminar el usuario" });
    } else {
      res.json({ message: "Usuario eliminado correctamente" });
    }
  });
});

app.put("/api/users/:id/approve", verifyRole("Administrador"), (req, res) => {
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

// Ruta protegida para el AdminDashboard
app.get("/api/admin/dashboard", verifyRole("Administrador"), (req, res) => {
  res.status(200).json({
    message: "Bienvenido al AdminDashboard",
    user: req.user, // Información del usuario decodificada desde el token
  });
});
app.get("/api/admin/stats", verifyRole("Administrador"), (req, res) => {
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
app.post(
  "/api/classes",
  verifyRole(["Administrador", "educador"]),
  (req, res) => {
    const { name, grade } = req.body;

    db.run(
      "INSERT INTO classes (name, grade) VALUES (?, ?)",
      [name, grade],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Error al crear la clase" });
        }
        res.json({ id: this.lastID, name, grade });
      }
    );
  }
);

// Endpoint para obtener todas las clases
app.get("/api/classes", verifyRole("Administrador, educador"), (req, res) => {
  db.all("SELECT * FROM classes", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener las clases" });
    }
    res.json(rows);
  });
});

// Endpoint para actualizar una clase
app.put("/api/classes/:id", (req, res) => {
  const { id } = req.params;
  const { name, grade, educator_id } = req.body;

  if (!name || !grade || !educator_id) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  db.run(
    "UPDATE classes SET name = ?, grade = ?, educator_id = ? WHERE id = ?",
    [name, grade, educator_id, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: "Error al actualizar la clase" });
      } else {
        res.json({ message: "Clase actualizada correctamente" });
      }
    }
  );
});

// Endpoint para eliminar una clase
app.delete(
  "/api/classes/:id",
  verifyRole(["Administrador", "educador"]),
  (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM classes WHERE id = ?", [id], function (err) {
      if (err) {
        return res.status(500).json({ error: "Error al eliminar la clase" });
      }
      res.json({ message: "Clase eliminada correctamente" });
    });
  }
);

app.post(
  "/api/classes/:classId/students",
  verifyRole(["Administrador", "educador"]),
  (req, res) => {
    const { classId } = req.params;
    const { student_id } = req.body;

    db.get("SELECT role FROM users WHERE id = ?", [student_id], (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al verificar el rol del usuario" });
      }

      if (!row || row.role !== "Estudiante") {
        return res.status(403).json({
          error: "Solo los estudiantes pueden ser asignados a una clase",
        });
      }

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
  }
);
// Endpoint para asignar estudiantes a una clase
/* app.post("/api/classes/:classId/students", verifyRole("admin"), (req, res) => {
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
}); */

// Endpoint para obtener los estudiantes de una clase
app.get(
  "/api/classes/:classId/students",
  verifyRole("Administrador"),
  (req, res) => {
    const { classId } = req.params;

    db.all(
      `SELECT users.id, users.user, users.email 
     FROM users 
     JOIN class_students ON users.id = class_students.student_id
     WHERE class_students.class_id = ?`,
      [classId],
      (err, rows) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error al obtener estudiantes" });
        }
        res.json(rows);
      }
    );
  }
);

app.get(
  "/api/classes/:classId/students",
  verifyRole("Administrador"),
  (req, res) => {
    const { classId } = req.params;

    db.all(
      `SELECT users.id, users.user, users.email 
     FROM users 
     JOIN class_students ON users.id = class_students.student_id
     WHERE class_students.class_id = ?`,
      [classId],
      (err, rows) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error al obtener estudiantes" });
        }
        res.json(rows);
      }
    );
  }
);

app.delete(
  "/api/classes/:classId/students/:studentId",
  verifyRole("Administrador"),
  (req, res) => {
    const { classId, studentId } = req.params;

    db.run(
      "DELETE FROM class_students WHERE class_id = ? AND student_id = ?",
      [classId, studentId],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error al remover estudiante de la clase" });
        }
        res.json({ message: "Estudiante removido correctamente" });
      }
    );
  }
);

app.get("/api/class_student/:class_id", (req, res) => {
  const { class_id } = req.params;

  db.all(
    `SELECT users.id, users.user as name 
     FROM class_students
     JOIN users ON class_students.student_id = users.id 
     WHERE class_students.class_id = ?`, // CORREGIDO: class_students en lugar de class_student
    [class_id],
    (err, rows) => {
      if (err) {
        res
          .status(500)
          .json({ error: "Error al obtener los estudiantes de la clase" });
      } else {
        res.json(rows);
      }
    }
  );
});

app.get(
  "/api/students/:studentId/classes",
  verifyRole("Administrador"),
  (req, res) => {
    const { studentId } = req.params;

    db.all(
      `SELECT classes.id, classes.name, classes.grade 
     FROM classes 
     JOIN class_students ON classes.id = class_students.class_id
     WHERE class_students.student_id = ?`,
      [studentId],
      (err, rows) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error al obtener historial de clases" });
        }
        res.json(rows);
      }
    );
  }
);

app.post("/api/class_students", (req, res) => {
  const { class_id, student_id } = req.body;
  if (!class_id || !student_id) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  db.run(
    "INSERT INTO class_student (class_id, student_id) VALUES (?, ?)",
    [class_id, student_id],
    function (err) {
      if (err) {
        res.status(500).json({ error: "Error al asignar estudiante" });
      } else {
        res.status(201).json({ message: "Estudiante asignado correctamente" });
      }
    }
  );
});

app.get("/api/student/info", verifyRole("Estudiante"), (req, res) => {
  const studentId = req.user.id;
  db.get("SELECT * FROM users WHERE id = ?", [studentId], (err, row) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener datos del estudiante" });
    }
    res.json(row);
  });
});

app.get("/api/student/classes", verifyRole("Estudiante"), (req, res) => {
  const studentId = req.user.id;
  db.all(
    `SELECT classes.* FROM class_student 
     JOIN classes ON class_student.class_id = classes.id 
     WHERE class_student.student_id = ?`,
    [studentId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Error al obtener las clases" });
      }
      res.json(rows);
    }
  );
});

app.get("/api/student/tasks", verifyRole("Estudiante"), (req, res) => {
  const studentId = req.user.id;
  db.all(
    `SELECT * FROM tasks WHERE assigned_to = ?`,
    [studentId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Error al obtener tareas" });
      }
      res.json(rows);
    }
  );
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
