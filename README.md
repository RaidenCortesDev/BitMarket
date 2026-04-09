# 🛒 BitMarket
E-commerce robusto desarrollado con **Node.js** y **Express.js**. Incluye un sistema avanzado de inventario, historial de precios dinámico y gestión de cupones.

[![Firebase Deploy](https://github.com/RaidenCortesDev/BitMarket/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://bitmarket-96c82.web.app/)

---

## 👥 Perfiles de Prueba (QA & Demo)
Para pruebas de entorno, auditorías de acceso y validación de roles, utilizar las siguientes credenciales genéricas. 

> **Nota:** Para facilitar el acceso en desarrollo, la **contraseña** de cada cuenta es su propio **correo electrónico**.

| Rol | Correo de Acceso / Contraseña | Alcance de Permisos |
| :--- | :--- | :--- |
| **Super Admin** | `admin@bitmarket.test` | Gestión total de inventario, edición de precios y creación de cupones. |
| **Cliente** | `cliente@bitmarket.test` | Flujo de compra, visualización de catálogo y redención de cupones. |

> [!IMPORTANT]
> **Disponibilidad del Servidor:** El backend utiliza una instancia gratuita de **Render**. Si el sitio tarda en cargar inicialmente, por favor espera unos **40 segundos** a que el servidor se active automáticamente. Una vez encendido, la experiencia será fluida.
---

## 🚀 Estándares de Mensajes de Commit
Utilizamos **Conventional Commits** para mantener un historial limpio:

- `feat:` Nuevas funcionalidades.
- `fix:` Corrección de errores.
- `docs:` Cambios en documentación.
- `style:` Formato, CSS, diseño (sin cambios en lógica).
- `refactor:` Mejora de código existente.
- `chore:` Mantenimiento, configuración de Firebase o GitHub Actions.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** [Lit](https://lit.dev/) (Web Components livianos y nativos).
- **Animaciones:** [@lit-labs/motion](https://www.npmjs.com/package/@lit-labs/motion) (Transiciones declarativas y fluidas para una mejor UX).. 
- **Validación de Datos:** [Zod](https://zod.dev/) (Esquemas de tipado fuerte).
- **Bundler:** [Vite](https://vitejs.dev/).

### Backend e Infraestructura (Híbrida)
- **Servidor API:** Node.js + Express.js.
- **Base de Datos:** **PostgreSQL** (Hospedada en [Render](https://render.com/)).
- **Gestión de Medios:** [Cloudinary](https://cloudinary.com/) (Almacenamiento y optimización de imágenes de productos).
- **Autenticación:** Firebase Auth.
- **Hosting Frontend:** [Firebase Hosting](https://firebase.google.com/).
- **CI/CD:** GitHub Actions (Despliegue automatizado).


## 🛠️ Configuración Local (Instalación)

Si deseas clonar este repositorio para realizar pruebas locales, sigue estos pasos para configurar tu entorno.

### 1. Requisitos Previos
* **Node.js** (v18 o superior)
* **PostgreSQL** (Instancia local o remota)
* **Cloudinary Account** (Opcional, para gestión de imágenes)

### 2. Variables de Entorno (.env)
Crea un archivo llamado `.env` en la carpeta raíz del **Backend** y configura las siguientes variables con tus credenciales:

```env
# Configuración de Base de Datos
DB_USER=tu_usuario_postgres
DB_HOST=tu_host
DB_PASSWORD=tu_contraseña
DB_NAME=bitmarket_db
DB_PORT=5432

# Configuración del Servidor
PORT=3000

# Configuración de Cloudinary (Para carga de imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 3. Base de Datos e Imágenes
* **Base de Datos:** El proyecto requiere una estructura de tablas específica (ver carpeta `/db` si está disponible o solicitar el script SQL).
* **Cloudinary:** El catálogo actual utiliza URLs directas de imágenes alojadas en mi cuenta de Cloudinary. Si deseas subir productos nuevos con imágenes propias, **debes configurar tus propias credenciales** en el archivo `.env`; de lo contrario, la carga de archivos fallará.

### 4. Instalación
```bash
# Instalar dependencias del Backend
cd backend
npm install
npm start

# Instalar dependencias del Frontend
cd ../frontend
npm install
npm run dev
