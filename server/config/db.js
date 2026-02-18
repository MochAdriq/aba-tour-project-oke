const mysql = require('mysql2/promise'); // Kita pakai mode Promise biar bisa async/await
const dotenv = require('dotenv');

dotenv.config();

// Buat Pool (Kolam Koneksi)
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aba_tour',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10, // Maksimal 10 koneksi sekaligus (Aman buat Railway)
    queueLimit: 0
});

// Cek koneksi pas awal jalan (Opsional, buat debug aja)
db.getConnection()
    .then(conn => {
        console.log("Database Connected Successfully via Pool!");
        conn.release(); // Balikin koneksi ke kolam
    })
    .catch(err => {
        console.error("Database Connection Failed:", err.message);
    });

const queryPromise = db.query.bind(db);
const executePromise = db.execute.bind(db);

// Compatibility wrapper: tetap bisa dipakai dengan callback-style query lama.
db.query = (sql, values, callback) => {
    let params = values;
    let cb = callback;

    if (typeof values === 'function') {
        cb = values;
        params = [];
    }

    const p = queryPromise(sql, params);

    if (typeof cb === 'function') {
        p.then(([rows, fields]) => cb(null, rows, fields)).catch((err) => cb(err));
        return;
    }

    return p;
};

db.execute = (sql, values, callback) => {
    let params = values;
    let cb = callback;

    if (typeof values === 'function') {
        cb = values;
        params = [];
    }

    const p = executePromise(sql, params);

    if (typeof cb === 'function') {
        p.then(([rows, fields]) => cb(null, rows, fields)).catch((err) => cb(err));
        return;
    }

    return p;
};

module.exports = db;
