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
- **Validación de Datos:** [Zod](https://zod.dev/) (Esquemas de tipado fuerte).
- **Bundler:** [Vite](https://vitejs.dev/).

### Backend e Infraestructura (Híbrida)
- **Servidor API:** Node.js + Express.js.
- **Base de Datos:** **PostgreSQL** (Hospedada en [Render](https://render.com/)).
- **Gestión de Medios:** [Cloudinary](https://cloudinary.com/) (Almacenamiento y optimización de imágenes de productos).
- **Autenticación:** Firebase Auth.
- **Hosting Frontend:** [Firebase Hosting](https://firebase.google.com/).
- **CI/CD:** GitHub Actions (Despliegue automatizado).