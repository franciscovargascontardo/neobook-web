/**
 * usuarios.routes.js - Router de Usuarios
 *
 * Un Router en Express es como una mini-aplicación que agrupa rutas relacionadas.
 * Aquí definimos QUÉ método HTTP + QUÉ path activa QUÉ función del controlador.
 *
 * Este router se monta en app.js bajo el prefijo /api/usuarios,
 * por lo que las rutas aquí son relativas a ese prefijo:
 *   "/" en este archivo === "/api/usuarios" en la app
 *   "/:id"               === "/api/usuarios/:id"
 */

const { Router } = require("express");

// Importamos todas las funciones del controlador
const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} = require("../controllers/usuarios.controller");

// Creamos una instancia de Router
const router = Router();

// ─────────────────────────────────────────
// Definición de rutas
// Sintaxis: router.MÉTODO(path, funcionControlador)
// ─────────────────────────────────────────

// GET  /api/usuarios         → lista todos (acepta ?rol=admin como query param)
// POST /api/usuarios         → crea uno nuevo (datos en el body)
router.get("/", obtenerUsuarios);
router.post("/", crearUsuario);

// GET    /api/usuarios/:id   → obtiene uno por ID (param en la URL)
// PUT    /api/usuarios/:id   → actualiza uno (ID en param + datos en body)
// DELETE /api/usuarios/:id   → elimina uno (ID en param)
router.get("/:id", obtenerUsuarioPorId);
router.put("/:id", actualizarUsuario);
router.delete("/:id", eliminarUsuario);

module.exports = router;
