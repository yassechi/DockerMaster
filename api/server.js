const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { Pool } = require("pg");

const app = express();
const PORT = 3001;

const dbConfig = {
  host: "localhost",
  port: 5432,
  database: "tajinedb",
  user: "yass",
  password: "root"
};

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  max: 10,
  idleTimeoutMillis: 30000
});

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

pool.on("error", (error) => {
  console.error("Connexion Postgres interrompue :", error.message);
});

async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

async function waitForDatabase(maxAttempts = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const rows = await query("SELECT NOW() AS now");
      return rows[0].now;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      console.warn(
        `Postgres indisponible (tentative ${attempt}/${maxAttempts}) : ${error.message}`
      );

      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
  }

  throw new Error("Connexion Postgres impossible.");
}

async function fetchPlats() {
  return query(
    `
      SELECT
        id,
        slug,
        name,
        description,
        meat,
        price,
        currency,
        spice_level AS "spiceLevel",
        is_signature AS "isSignature",
        created_at AS "createdAt"
      FROM tajines
      ORDER BY is_signature DESC, price ASC, id ASC
    `
  );
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(value);
}

app.get("/api", (req, res) => {
  res.json({
    message: "API connectee a Postgres.",
    endpoints: [
      "GET /api/health",
      "GET /api/plats",
      "GET /api/tajines",
      "GET /api/reservations",
      "POST /api/reservations"
    ]
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const rows = await query("SELECT NOW() AS now");

    res.json({
      status: "ok",
      database: "connected",
      time: rows[0].now
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      message: error.message
    });
  }
});

app.get("/api/plats", async (req, res, next) => {
  try {
    const rows = await fetchPlats();

    res.json({
      count: rows.length,
      items: rows
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/tajines", async (req, res, next) => {
  try {
    const rows = await fetchPlats();

    res.json({
      count: rows.length,
      items: rows
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/reservations", async (req, res, next) => {
  try {
    const rows = await query(
      `
        SELECT
          id,
          name,
          phone,
          reservation_date AS date,
          reservation_time AS time,
          guests,
          notes,
          created_at AS "createdAt"
        FROM reservations
        ORDER BY reservation_date DESC, reservation_time DESC, id DESC
      `
    );

    res.json({
      count: rows.length,
      items: rows
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/reservations", async (req, res, next) => {
  const { name, phone, date, time, guests, notes = "" } = req.body ?? {};
  const parsedGuests = Number(guests);

  if (
    !name ||
    !phone ||
    !date ||
    !time ||
    !Number.isInteger(parsedGuests) ||
    parsedGuests < 1 ||
    !isValidDate(String(date)) ||
    !isValidTime(String(time))
  ) {
    return res.status(400).json({
      error: "name, phone, date, time et guests sont requis."
    });
  }

  try {
    const rows = await query(
      `
        INSERT INTO reservations (
          name,
          phone,
          reservation_date,
          reservation_time,
          guests,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          name,
          phone,
          reservation_date AS date,
          reservation_time AS time,
          guests,
          notes,
          created_at AS "createdAt"
      `,
      [
        String(name).trim(),
        String(phone).trim(),
        String(date).trim(),
        String(time).trim(),
        parsedGuests,
        String(notes).trim()
      ]
    );

    return res.status(201).json({
      message: "Reservation enregistree avec succes.",
      reservation: rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "Route API introuvable."
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    error: "Une erreur interne est survenue."
  });
});

async function startServer() {
  try {
    const databaseTime = await waitForDatabase();
    console.log(`Connexion Postgres etablie. Heure DB: ${databaseTime}`);

    app.listen(PORT, () => {
      console.log(`API en ecoute sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Impossible de demarrer sans Postgres :", error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`Arret recu (${signal}), fermeture du pool Postgres.`);
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

startServer();
