# WebApp - API REST .NET con Pipeline CI/CD Automatizado

**Proyecto Integrador Parcial 1: Pipeline CI/CD Automatizado para API REST**  
**Universidad Tecnológica de Querétaro (UTEQ)**  
**Ingeniería en Desarrollo y Gestión de Software**  
**Asignatura:** Gestión de Software  
**Alumno:** Job De La Vega Villalobos  
**Matrícula:** 2023371157 | **Grupo:** IDGS14  
**GitHub:** [https://github.com/RayderHub/Webapp](https://github.com/RayderHub/Webapp)  
**Docker Hub:** `raydererizo/webapp`  
**Servidor AWS EC2:** `http://3.21.103.18/api/health`

---

## 🏛 Arquitectura del Sistema
- **Backend Framework:** ASP.NET Core (.NET 10 SDK)
- **Base de Datos:** SQLite con Entity Framework Core (`webapp.db`)
- **Protocolos Soportados:** 
  - HTTP REST (Puerto 8080 interno, mapeado al puerto 80)
  - TCP Sockets Concurrente (Puerto 6061)
- **Pruebas Automatizadas:** xUnit + FluentAssertions (25 pruebas unitarias)
- **Contenedorización:** Docker (`mcr.microsoft.com/dotnet/aspnet:10.0`) publicado en Docker Hub (`raydererizo/webapp`)
- **Infraestructura Cloud:** AWS EC2 (Ubuntu Server) en `3.21.103.18`
- **Automatización CI/CD:** GitHub Actions (Compilación, pruebas automáticas xUnit, empaquetado Docker y despliegue continuo vía SSH)

---

## 🌐 Endpoints HTTP Disponibles

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Healthcheck que valida disponibilidad y conectividad del servicio |
| `GET` | `/api/products` | Consulta el catálogo completo de productos |
| `GET` | `/api/products/{id}` | Consulta un producto específico por ID |
| `POST` | `/api/products` | Registra un nuevo producto |
| `PUT` | `/api/products/{id}` | Modifica los datos de un producto |
| `DELETE` | `/api/products/{id}` | Elimina un producto por ID |
| `GET` | `/api/categories` | Consulta todas las categorías |
| `GET` | `/api/categories/{id}` | Consulta una categoría por ID |
| `POST` | `/api/categories` | Registra una nueva categoría |
| `PUT` | `/api/categories/{id}` | Modifica una categoría |
| `DELETE` | `/api/categories/{id}` | Elimina una categoría por ID |
| `POST` | `/api/backup` | Genera una copia de respaldo física de la base de datos |
| `POST` | `/api/vaciar` | Elimina todos los registros de la base de datos |

---

## 🔌 Protocolo TCP Sockets (Puerto 6061)

El servidor socket concurrente corre en segundo plano en el puerto `6061`:
1. **Insertar categoría:** `{insert:{"name":"Electrónica"}}`
2. **Consultar categoría por ID:** `{get:1}`

---

## 🚀 Comandos Locales (Desarrollo)

### Ejecutar Pruebas Automatizadas (xUnit)
```bash
dotnet test WebApp.Tests/WebApp.Tests.csproj
```

### Ejecutar la Aplicación Localmente
```bash
dotnet run --project WebApp.csproj
```

### Construcción y Ejecución en Docker
```bash
docker build -t raydererizo/webapp:latest .
docker run -d -p 80:8080 -p 6061:6061 --name webapp-container raydererizo/webapp:latest
```

---

## ⚙ Configuración de Secretos en GitHub (Actions Secrets)

| Secreto | Descripción | Valor |
|---|---|---|
| `DOCKER_USERNAME` | Usuario de Docker Hub | `raydererizo` |
| `DOCKER_PASSWORD` | Access Token de Docker Hub | `dckr_pat_...` |
| `EC2_HOST` | IP pública de la instancia AWS EC2 | `3.21.103.18` |
| `EC2_USER` | Usuario SSH de Ubuntu Server | `ubuntu` |
| `EC2_SSH_KEY` | Contenido de la llave privada `Pablo.pem` | `-----BEGIN RSA PRIVATE KEY-----...` |

---

## 🔄 Flujo del Pipeline CI/CD (.github/workflows/main.yml)

Al hacer `git push` a `main`:
1. **Checkout:** Descarga el código.
2. **Setup .NET:** Configura .NET 10 SDK.
3. **Restore:** Restaura paquetes NuGet.
4. **Test:** Corre la suite de pruebas unitarias xUnit (`dotnet test`). Si una prueba falla, el flujo se detiene inmediatamente.
5. **Docker Login & Push:** Autentica y sube la imagen a Docker Hub (`raydererizo/webapp:latest`).
6. **SSH Deploy:** Se conecta a AWS EC2, descarga la última imagen y levanta el contenedor con los puertos 80 y 6061.