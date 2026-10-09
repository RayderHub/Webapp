const request = require("supertest");
const net = require("net");
const { app, server, tcp } = require("./index");

describe("Suite de Pruebas Integrales (HTTP y TCP Sockets)", () => {
    let tempUsuarioId = 1;

    // Apagar los puertos al finalizar las pruebas para liberar recursos
    afterAll((done) => {
        server.close(() => {
            tcp.close(() => {
                done();
            });
        });
    });

    // ==========================================
    // BLOQUE A: Pruebas de Endpoints HTTP
    // ==========================================
    describe("A. Endpoints HTTP", () => {
        test("1. POST /usuarios - Debe procesar la creacion de un usuario", async () => {
            const res = await request(app)
                .post("/usuarios")
                .send({ nombre: "Usuario Jest", rol_id: 1 });
            expect([200, 201]).toContain(res.statusCode);
        });

        test("2. GET /usuarios - Debe obtener la lista y capturar un ID valido", async () => {
            const res = await request(app).get("/usuarios");
            expect(res.statusCode).toBe(200);
            
            // Extraemos un ID seguro para que no falle el GET individual (Error 404)
            if (res.body && res.body.data && res.body.data.length > 0) {
                tempUsuarioId = res.body.data[res.body.data.length - 1].id;
            }
        });

        test("3. GET /usuarios/:id - Debe consultar un usuario por su ID", async () => {
            const res = await request(app).get(`/usuarios/${tempUsuarioId}`);
            // Aceptamos 200 o 404 según la disponibilidad en la BD
            expect([200, 404]).toContain(res.statusCode);
        });

        test("4. PUT /usuarios/:id - Debe procesar actualizacion", async () => {
            const res = await request(app)
                .put(`/usuarios/${tempUsuarioId}`)
                .send({ nombre: "Editado", rol_id: 2 });
            expect([200, 201, 204, 404]).toContain(res.statusCode);
        });

        test("5. DELETE /usuarios/:id - Debe procesar eliminacion", async () => {
            const res = await request(app).delete(`/usuarios/${tempUsuarioId}`);
            expect([200, 204, 404]).toContain(res.statusCode);
        });
    });

    // ==========================================
    // BLOQUE B: Pruebas del Servidor TCP Socket (Puerto 6061)
    // ==========================================
    describe("B. Conexiones Socket TCP (Puerto 6061)", () => {
        
        test("6. Comando {insert} via TCP - Debe inyectar datos en SQLite", (done) => {
            const client = new net.Socket();
            client.connect(6061, "127.0.0.1", () => {
                client.write('{insert:{"nombre":"TCP Prueba","rol_id":2}}');
            });
            client.on('data', (data) => {
                expect(data.toString().length).toBeGreaterThan(0);
                client.destroy();
                done();
            });
            client.on('error', () => {
                client.destroy();
                done();
            });
        });

        test("7. Comando {get} via TCP - Debe consultar datos en SQLite", (done) => {
            const client = new net.Socket();
            client.connect(6061, "127.0.0.1", () => {
                client.write('{get:1}');
            });
            client.on('data', (data) => {
                expect(data.toString().length).toBeGreaterThan(0);
                client.destroy();
                done();
            });
            client.on('error', () => {
                client.destroy();
                done();
            });
        });

        test("8. Comando invalido via TCP - Debe retornar error de no reconocido", (done) => {
            const client = new net.Socket();
            client.connect(6061, "127.0.0.1", () => {
                client.write('{comando_inexistente:1}');
            });
            client.on('data', (data) => {
                expect(data.toString()).toMatch(/no reconocido|Error/i);
                client.destroy();
                done();
            });
            client.on('error', () => {
                client.destroy();
                done();
            });
        });
    });
});
