const net = require('net');

// Configuración de la conexión al Socket TCP en AWS EC2
const IP_DESTINO = process.env.EC2_HOST || '3.21.103.18';
const PUERTO = process.env.TCP_PORT || 6061;

const cliente = new net.Socket();

console.log(`Intentando conectar al Socket TCP en ${IP_DESTINO}:${PUERTO}...`);

cliente.connect(PUERTO, IP_DESTINO, () => {
    console.log(`Conectado exitosamente al Socket TCP en ${IP_DESTINO}:${PUERTO}`);
    
    // 1. Probar inserción de un elemento vía socket
    const nuevoUsuario = JSON.stringify({ nombre: "Estudiante Job De La Vega", rol_id: 1 });
    const comandoInsert = `{insert:${nuevoUsuario}}`;
    console.log(`Enviando comando: ${comandoInsert}`);
    cliente.write(comandoInsert);
    
    // 2. Esperar respuesta y consultar el registro creado
    setTimeout(() => {
        const comandoGet = '{get:1}';
        console.log(`Enviando comando: ${comandoGet}`);
        cliente.write(comandoGet);
    }, 1000);
});

cliente.on('data', (data) => {
    console.log('Respuesta recibida del servidor: ' + data.toString());
});

cliente.on('error', (err) => {
    console.error('Error de conexión con el socket:', err.message);
});

cliente.on('close', () => {
    console.log('Conexión con el servidor socket finalizada.');
});
