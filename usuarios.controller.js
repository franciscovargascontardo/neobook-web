/**
 * usuarios.controller.js - Controlador de Usuarios
 *
 * Un controlador contiene la LÓGICA DE NEGOCIO de cada endpoint.
 * Recibe (req, res) desde el router y decide qué responder.
 *
 * req → objeto con toda la info de la petición (body, params, query, headers...)
 * res → objeto para construir y enviar la respuesta HTTP
 */

const db = require("../data/db");

// ─────────────────────────────────────────
// GET /api/usuarios
// Devuelve todos los usuarios
// ─────────────────────────────────────────
const obtenerUsuarios = (req, res) => {
  // req.query permite leer los query params de la URL
  // Ejemplo: GET /api/usuarios?rol=admin
  const { rol } = req.query;

  if (rol) {
    // Filtramos los usuarios por rol si se pasó como query param
    const filtrados = db.usuarios.filter((u) => u.rol === rol);
    return res.json({
      total: filtrados.length,
      filtro: { rol },
      usuarios: filtrados,
    });
  }

  // Sin filtro, devolvemos todos
  res.json({ total: db.usuarios.length, usuarios: db.usuarios });
};

// ─────────────────────────────────────────
// GET /api/usuarios/:id
// Devuelve un usuario por su ID (leída desde los params de la URL)
// ─────────────────────────────────────────
const obtenerUsuarioPorId = (req, res) => {
  // req.params contiene las variables definidas con ":" en la ruta
  // Si la ruta es /usuarios/:id y la URL es /usuarios/2, entonces req.params.id === "2"
  // OJO: los params siempre son strings, por eso usamos Number()
  const id = Number(req.params.id);

  const usuario = db.usuarios.find((u) => u.id === id);

  if (!usuario) {
    // Respondemos con 404 si no existe
    return res.status(404).json({ error: `Usuario con id ${id} no encontrado` });
  }

  res.json(usuario);
};

// ─────────────────────────────────────────
// POST /api/usuarios
// Crea un nuevo usuario con los datos del body
// ─────────────────────────────────────────
const crearUsuario = (req, res) => {
  // req.body contiene el JSON que el cliente envió en el cuerpo de la petición
  // Funciona gracias al middleware express.json() que configuramos en app.js
  const { nombre, email, rol } = req.body;

  // Validación básica: campos obligatorios
  if (!nombre || !email) {
    return res.status(400).json({
      error: "Los campos 'nombre' y 'email' son obligatorios",
    });
  }

  // Verificamos que el email no esté duplicado
  const emailExiste = db.usuarios.some((u) => u.email === email);
  if (emailExiste) {
    return res.status(409).json({ error: "Ya existe un usuario con ese email" });
  }

  // Creamos el nuevo usuario
  const nuevoUsuario = {
    id: db.getNextUsuarioId(), // ID auto-incremental en memoria
    nombre,
    email,
    rol: rol || "user", // Valor por defecto si no se envía
  };

  // Lo agregamos al array en memoria
  db.usuarios.push(nuevoUsuario);

  // Respondemos con 201 Created y el recurso creado
  res.status(201).json(nuevoUsuario);
};

// ─────────────────────────────────────────
// PUT /api/usuarios/:id
// Actualiza un usuario existente (mezcla params + body)
// ─────────────────────────────────────────
const actualizarUsuario = (req, res) => {
  const id = Number(req.params.id); // ID viene del param de la URL
  const { nombre, email, rol } = req.body; // Datos nuevos vienen del body

  // Buscamos el índice del usuario en el array
  const index = db.usuarios.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Usuario con id ${id} no encontrado` });
  }

  // Actualizamos solo los campos que se enviaron (spread operator)
  // Si no se envía un campo, conserva el valor anterior
  const usuarioActualizado = {
    ...db.usuarios[index], // Copia el objeto actual
    ...(nombre && { nombre }), // Sobreescribe solo si se proporcionó
    ...(email && { email }),
    ...(rol && { rol }),
  };

  db.usuarios[index] = usuarioActualizado;

  res.json(usuarioActualizado);
};

// ─────────────────────────────────────────
// DELETE /api/usuarios/:id
// Elimina un usuario por ID
// ─────────────────────────────────────────
const eliminarUsuario = (req, res) => {
  const id = Number(req.params.id);
  const index = db.usuarios.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Usuario con id ${id} no encontrado` });
  }

  // splice elimina el elemento del array en memoria
  const [eliminado] = db.usuarios.splice(index, 1);

  // 200 OK con el recurso eliminado (también se puede responder 204 No Content)
  res.json({ mensaje: "Usuario eliminado correctamente", usuario: eliminado });
};

// Exportamos las funciones para que el router las pueda usar
module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
};
