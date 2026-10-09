const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const net = require('net');

const app = express();
app.use(express.json());

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY, nombre TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY, nombre TEXT, rol_id INTEGER, FOREIGN KEY(rol_id) REFERENCES roles(id))");
});

const sendResponse = (res, statusCode, data) => {
    res.status(statusCode).json({ statusCode, data });
};

// 1. Obtener todos los usuarios
app.get('/usuarios', (req, res) => {
    db.all("SELECT * FROM usuarios", [], (err, rows) => {
        if (err) return sendResponse(res, 500, err.message);
        sendResponse(res, 200, rows);
    });
});

// 2. Crear un nuevo usuario
app.post('/usuarios', (req, res) => {
    const { nombre, rol_id } = req.body;
    db.run("INSERT INTO usuarios (nombre, rol_id) VALUES (?, ?)", [nombre, rol_id], function(err) {
        if (err) return sendResponse(res, 500, err.message);
        sendResponse(res, 201, { id: this.lastID, nombre, rol_id });
    });
});

// 3. Consultar usuario por ID
app.get('/usuarios/:id', (req, res) => {
    db.get("SELECT * FROM usuarios WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return sendResponse(res, 500, err.message);
        if (!row) return sendResponse(res, 404, "Usuario no encontrado");
        sendResponse(res, 200, row);
    });
});

// 4. Actualizar usuario por ID
app.put('/usuarios/:id', (req, res) => {
    const { nombre, rol_id } = req.body;
    db.run("UPDATE usuarios SET nombre = ?, rol_id = ? WHERE id = ?", [nombre, rol_id, req.params.id], function(err) {
        if (err) return sendResponse(res, 500, err.message);
        if (this.changes === 0) return sendResponse(res, 404, "Usuario no encontrado");
        sendResponse(res, 200, { mensaje: "Usuario actualizado exitosamente" });
    });
});

// 5. Eliminar usuario por ID
app.delete('/usuarios/:id', (req, res) => {
    db.run("DELETE FROM usuarios WHERE id = ?", req.params.id, function(err) {
        if (err) return sendResponse(res, 500, err.message);
        sendResponse(res, 200, { eliminados: this.changes });
    });
});

// 6. Endpoint de Monitoreo / Healthcheck
app.get('/api/health', (req, res) => {
    sendResponse(res, 200, { status: "OK", mensaje: "API funcionando y conectada Job De La Vega" });
});

// 7. Endpoint de Respaldo de Base de Datos
app.get('/backup', (req, res) => {
    const backupPath = path.resolve(__dirname, `backup_${Date.now()}.sqlite`);
    fs.copyFile(dbPath, backupPath, (err) => {
        if (err) return sendResponse(res, 500, "Error al respaldar la base de datos");
        sendResponse(res, 200, { mensaje: "Respaldo exitoso", archivo: backupPath });
    });
});

// 8. Endpoint para vaciar tablas
app.delete('/vaciar', (req, res) => {
    db.serialize(() => {
        db.run("DELETE FROM usuarios");
        db.run("DELETE FROM roles", (err) => {
            if (err) return sendResponse(res, 500, err.message);
            sendResponse(res, 200, { mensaje: "Base de datos vaciada correctamente" });
        });
    });
});

// Servidor Socket TCP concurrente
const tcpServer = net.createServer((socket) => {
    socket.on('data', (data) => {
        const comando = data.toString().trim();
        if (comando.startsWith('{insert:') && comando.endsWith('}')) {
            const elementoJson = comando.substring(8, comando.length - 1);
            try {
                const { nombre, rol_id } = JSON.parse(elementoJson);
                db.run("INSERT INTO usuarios (nombre, rol_id) VALUES (?, ?)", [nombre, rol_id], function(err) {
                    if (err) socket.write(`Error DB: ${err.message}\n`);
                    else socket.write(`Usuario insertado via Socket con ID: ${this.lastID}\n`);
                });
            } catch (error) {
                socket.write("Error: Formato JSON inválido.\n");
            }
        } 
        else if (comando.startsWith('{get:') && comando.endsWith('}')) {
            const id = comando.substring(5, comando.length - 1);
            db.get("SELECT * FROM usuarios WHERE id = ?", [id], (err, row) => {
                if (err) socket.write(`Error DB: ${err.message}\n`);
                else if (row) socket.write(JSON.stringify(row) + '\n');
                else socket.write("Usuario no encontrado\n");
            });
        } else {
            socket.write("Comando de socket no reconocido\n");
        }
    });
});

const HTTP_PORT = process.env.PORT || 80;
const TCP_PORT = process.env.TCP_PORT || 6061;

const server = app.listen(HTTP_PORT, () => {
    console.log(`Servidor backend ejecutándose en el puerto ${HTTP_PORT}`);
});

const tcp = tcpServer.listen(TCP_PORT, () => {
    console.log(`Servidor Socket TCP ejecutándose en el puerto ${TCP_PORT}`);
});

module.exports = { app, server, tcp };
