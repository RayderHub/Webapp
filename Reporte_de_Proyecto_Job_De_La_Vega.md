# UNIVERSIDAD TECNOLÓGICA DE QUERÉTARO

**Ingeniería en Desarrollo y Gestión de Software**  
**Asignatura:** Gestión de Software  
**Alumno:** Job De La Vega Villalobos  
**Matrícula:** 2023371157  
**Grupo:** IDGS14  
**Fecha:** 08 de Octubre 2026  

---

## Proyecto Integrador Parcial 1: Pipeline CI/CD Automatizado para API REST

### Introducción

En la industria actual del desarrollo de software, la entrega de valor constante y libre de errores es un pilar fundamental para el éxito de cualquier proyecto tecnológico. La adopción de la cultura DevOps y, en específico, la implementación de flujos de Integración Continua (CI) y Despliegue Continuo (CD), ha transformado la manera en que los equipos de ingeniería construyen, prueban y liberan aplicaciones. El presente proyecto integrador documenta el diseño, configuración y puesta en marcha de un pipeline CI/CD completamente automatizado para una API RESTful desarrollada en ASP.NET Core (.NET 10 SDK) con persistencia en SQLite mediante Entity Framework Core y un servidor concurrente TCP Sockets, con el objetivo de eliminar procesos manuales y garantizar que cada cambio en el código fuente sea validado rigurosamente antes de llegar a producción.

La Integración Continua (CI) permite que los desarrolladores integren su código en un repositorio compartido de forma frecuente y segura. En este proyecto, dicha integración se gestiona mediante GitHub Actions, orquestando eventos ante cada push en la rama principal (`main`). Al detectar cambios, el sistema ejecuta de manera desatendida una suite de pruebas unitarias construida con xUnit y FluentAssertions. Este paso asegura que ninguna modificación rompa la lógica del negocio ni los contratos de los endpoints. Únicamente si la totalidad de las pruebas resulta exitosa, el flujo avanza hacia la fase de empaquetado, donde la aplicación se compila y encapsula en una imagen de contenedor Docker optimizada (`mcr.microsoft.com/dotnet/aspnet:10.0`) y se publica en el registro de artefactos de Docker Hub.

Por su parte, el Despliegue Continuo (CD) cierra el ciclo de vida llevando el artefacto directamente hacia la infraestructura cloud sin intervención humana. En esta implementación se aprovisionó una máquina virtual Ubuntu Server en Amazon Web Services (AWS EC2). A través de conexiones cifradas mediante el protocolo SSH, el pipeline se autentica en la instancia, descarga la imagen más reciente desde Docker Hub, detiene el contenedor previo y levanta la nueva versión exponiendo el puerto 80 para tráfico HTTP y el puerto 6061 para tráfico de Sockets TCP, resguardando las credenciales sensibles mediante GitHub Secrets.

---

### Resultados

El desarrollo y automatización se consolidó en tres fases técnicas principales, cumpliendo con los requerimientos de arquitectura, calidad de código y despliegue en la nube.

#### Enlaces al Repositorio (GitHub Actions y Código):
* **Repositorio principal:** [https://github.com/RayderHub/Webapp](https://github.com/RayderHub/Webapp)
* **Archivo de Workflow CI/CD (`main.yml`):** [https://github.com/RayderHub/Webapp/blob/main/.github/workflows/main.yml](https://github.com/RayderHub/Webapp/blob/main/.github/workflows/main.yml)
* **Historial de ejecuciones en GitHub Actions:** [https://github.com/RayderHub/Webapp/actions](https://github.com/RayderHub/Webapp/actions)

#### URL Pública de la API (AWS EC2):
* **Healthcheck:** [http://3.21.103.18/api/health](http://3.21.103.18/api/health)

---

### Fase 1: Desarrollo y calidad de código

Se construyó la API REST incorporando 13 endpoints funcionales que administran las entidades de Productos y Categorías, así como operaciones administrativas de respaldo físico de la base de datos (`/api/backup`), truncado (`/api/vaciar`), monitoreo (`/api/health`) y un servidor Socket TCP concurrente en el puerto `6061`. Para asegurar la confiabilidad del software, se diseñó e implementó una suite integral de 25 pruebas unitarias automatizadas con xUnit y FluentAssertions evaluando respuestas HTTP, esquemas normalizados y manejo de excepciones.

```text
Passed!  - Failed:     0, Passed:    25, Skipped:     0, Total:    25, Duration: 1 s - WebApp.Tests.dll (net10.0)
```
*Figura 1. Ejecución exitosa de la suite de 25 pruebas unitarias con xUnit y .NET 10 SDK, validando el 100% de los casos de prueba sin fallos.*

---

### Fase 2: Integración Continua (CI)

Se configuró el pipeline en el archivo `.github/workflows/main.yml`. Ante cada evento en la rama `main`, la máquina virtual de GitHub Actions ejecuta los siguientes pasos automatizados:
1. Descarga del código fuente (`actions/checkout@v4`).
2. Configuración del entorno .NET 10 SDK (`actions/setup-dotnet@v4`).
3. Restauración de dependencias del proyecto (`dotnet restore`).
4. Ejecución obligatoria de la suite de pruebas unitarias (`dotnet test WebApp.Tests/WebApp.Tests.csproj`).
5. Autenticación en Docker Hub con credenciales seguras (`docker/login-action@v3`).
6. Construcción y publicación de la imagen en Docker Hub (`raydererizo/webapp:latest` y etiqueta SHA de confirmación).

*(Espacio para Figura 2: Resumen de ejecución exitosa del workflow en GitHub Actions mostrando todos los checks en verde).*

---

### Fase 3: Despliegue Continuo (CD) en AWS

Utilizando la llave privada `.pem` (`Pablo.pem`) resguardada de forma encriptada en los secretos de GitHub (`EC2_SSH_KEY`), el pipeline se conecta automáticamente mediante SSH a la instancia AWS EC2 en `3.21.103.18`, descarga la imagen dockerizada actualizada y ejecuta el contenedor mapeando el puerto 80 del servidor hacia el puerto interno 8080 del servicio, y el puerto 6061 para sockets TCP.

Petición HTTP a la dirección IP pública de la instancia AWS EC2 en la ruta `/api/health`:
```json
{
  "statusCode": 200,
  "data": {
    "status": "OK",
    "mensaje": "API funcionando y conectada Job De La Vega"
  }
}
```
*Figura 3. Petición HTTP a la dirección IP pública de la instancia AWS EC2, que demuestra que el despliegue automático fue exitoso y la API responde correctamente en la nube.*

---

### Conclusión

La implementación de este pipeline CI/CD demuestra de manera práctica cómo las prácticas de DevOps reducen los riesgos asociados con la liberación de software. Al delegar la ejecución de pruebas, el empaquetado en contenedores Docker y el despliegue en AWS EC2 a un orquestador como GitHub Actions, se elimina la posibilidad de fallos por error humano en tareas repetitivas. Esto permite enfocar el desarrollo en la lógica de negocio, con la certeza de que el pipeline rechazará cualquier código que no cumpla con los estándares de calidad definidos.

Dominar estas arquitecturas resulta fundamental para la ingeniería de software moderna. La separación de responsabilidades, el manejo seguro de credenciales mediante secretos y el uso de imágenes inmutables favorecen la disponibilidad del servicio y la escalabilidad del sistema a futuro. Este proyecto consolida las bases técnicas necesarias para gestionar entornos de producción reales.

---

### Fuentes de información

1. Amazon Web Services. (2026). *¿Qué es la integración continua y el despliegue continuo (CI/CD)?* AWS.  
   https://aws.amazon.com/es/devops/continuous-integration/

2. Docker Documentation. (2026). *Docker overview.* Docker Docs.  
   https://docs.docker.com/get-started/overview/

3. GitHub Docs. (2026). *Understanding GitHub Actions.* GitHub Documentation.  
   https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions
