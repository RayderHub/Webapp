# P1IntdOps - API REST con Pipeline CI/CD Automatizado

**Proyecto Integrador Parcial 1: Pipeline CI/CD Automatizado para API REST**  
**Universidad Tecnológica de Querétaro (UTEQ)**  
**Ingeniería en Desarrollo y Gestión de Software**  
**Asignatura:** Gestión de Software  
**Alumno:** Job De La Vega Villalobos  
**Matrícula:** 2023371157 | **Grupo:** IDGS14  
**GitHub:** [https://github.com/RayderErizo/P1IntdOps](https://github.com/RayderErizo/P1IntdOps)  
**Docker Hub:** `raydererizo/webapp`  
**Servidor AWS EC2:** `http://3.21.103.18/api/health`

---

## 🏛 Arquitectura del Sistema
- **Backend Framework:** Node.js + Express.js
- **Base de Datos:** SQLite3 (Persistencia local en `database.sqlite`)
- **Protocolos Soportados:** 
  - HTTP REST (Puerto 80)
  - TCP Sockets Concurrente (Puerto 6061)
- **Contenedorización:** Docker (`node:18-alpine`) publicado en Docker Hub (`raydererizo/webapp`)
- **Infraestructura Cloud:** AWS EC2 (Ubuntu Server) en `3.21.103.18`
- **Automatización CI/CD:** GitHub Actions (Pruebas unitarias, validación de cobertura >70%, empaquetado y despliegue continuo vía SSH con llave PEM)

---

## 🌐 Endpoints HTTP Disponibles

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/usuarios` | Consulta el listado completo de usuarios registrados |
| `POST` | `/usuarios` | Registra un nuevo usuario (`nombre`, `rol_id`) |
| `GET` | `/usuarios/:id` | Consulta la información de un usuario específico por su ID |
| `PUT` | `/usuarios/:id` | Modifica los datos de un usuario existente |
| `DELETE` | `/usuarios/:id` | Elimina un usuario por su ID |
| `GET` | `/api/health` | Monitoreo del estado del servicio (Healthcheck) |
| `GET` | `/backup` | Crea una copia de respaldo física de la base de datos |
| `DELETE` | `/vaciar` | Trunca/elimina todos los registros de usuarios y roles |

---

## 🔌 Protocolo TCP Sockets (Puerto 6061)

El servidor socket concurrente escucha en el puerto `6061` y procesa los siguientes comandos en texto plano:
1. **Insertar registro:**
   ```text
   {insert:{"nombre":"Estudiante Job De La Vega","rol_id":1}}
   ```
2. **Consultar registro por ID:**
   ```text
   {get:1}
   ```
3. **Comando no reconocido:** Retorna mensaje de error.

Para ejecutar la prueba hacia el servidor:
```bash
node cliente-socket.js
```

---

## 🚀 Comandos Locales (Desarrollo)

### 1. Instalación de Dependencias
```bash
npm install
```

### 2. Ejecutar Pruebas Automatizadas y Cobertura (Jest)
Valida que se cumpla la política de calidad (mínimo 70% de cobertura en líneas y declaraciones):
```bash
npm run test:coverage
```

### 3. Levantar la API en Modo Desarrollo
```bash
npm start
```

### 4. Construcción y Ejecución con Docker
```bash
docker build -t raydererizo/webapp:latest .
docker run -d -p 80:80 -p 6061:6061 --name webapp-container raydererizo/webapp:latest
```

---

## ⚙ Configuración de Secretos en GitHub (Actions Secrets)

Para habilitar el despliegue automático hacia AWS EC2, se configuran los siguientes secretos en el repositorio GitHub (**Settings > Secrets and variables > Actions > New repository secret**):

| Secreto | Descripción | Valor Configurado |
|---|---|---|
| `DOCKER_USERNAME` | Nombre de usuario en Docker Hub | `raydererizo` |
| `DOCKER_PASSWORD` | Token de acceso personal (PAT) de Docker Hub | `dckr_pat_...` |
| `EC2_HOST` | Dirección IP pública de la instancia EC2 | `3.21.103.18` |
| `EC2_USER` | Usuario de conexión SSH | `ubuntu` |
| `EC2_SSH_KEY` | Contenido de la llave privada `Pablo.pem` | `-----BEGIN RSA PRIVATE KEY-----...` |

---

## 🔄 Flujo del Pipeline CI/CD (.github/workflows/main.yml)

Al realizar un `git push` a la rama `main`:
1. **Checkout:** Descarga el código fuente más reciente.
2. **Node Environment:** Configura Node.js versión 18.
3. **Dependencies:** Instala dependencias con `npm install`.
4. **Testing & Coverage:** Corre Jest (`npm run test:coverage`). Si no supera el 70% de cobertura o falla un test, el pipeline se aborta.
5. **Docker Login & Push:** Autentica y publica la imagen en Docker Hub (`raydererizo/webapp:latest` y hash SHA).
6. **SSH Deploy en AWS EC2:** Conecta a la instancia `3.21.103.18`, descarga la imagen actualizada, detiene la versión previa y levanta el contenedor mapeando los puertos 80 y 6061.
