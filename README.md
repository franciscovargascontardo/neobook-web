# 🚀 Repaso de Express.js

Proyecto didáctico para repasar los conceptos fundamentales de Express.js:
rutas, controladores, middlewares, `req.params`, `req.body` y `req.query`.

---

## 📁 Estructura del proyecto

```
expressjs-repaso/
├── src/
│   ├── app.js                          # Punto de entrada: configura Express y monta rutas
│   ├── data/
│   │   └── db.js                       # "Base de datos" en memoria (arrays)
│   ├── routes/
│   │   ├── usuarios.routes.js          # Define las rutas del recurso /usuarios
│   │   └── productos.routes.js         # Define las rutas del recurso /productos
│   └── controllers/
│       ├── usuarios.controller.js      # Lógica de negocio de usuarios
│       └── productos.controller.js     # Lógica de negocio de productos
├── package.json
└── README.md
```

---

## ▶️ Cómo ejecutar

```bash
# Instalar dependencias
npm install

# Modo producción
npm start

# Modo desarrollo con hot-reload (Node 18+)
npm run dev
```

El servidor arranca en `http://localhost:3000`

---

## 🔌 Endpoints disponibles

### Usuarios

| Método | Ruta | Descripción | Fuente de datos |
|--------|------|-------------|-----------------|
| GET | `/api/usuarios` | Lista todos los usuarios | — |
| GET | `/api/usuarios?rol=admin` | Filtra por rol | `req.query` |
| GET | `/api/usuarios/:id` | Obtiene un usuario por ID | `req.params` |
| POST | `/api/usuarios` | Crea un nuevo usuario | `req.body` |
| PUT | `/api/usuarios/:id` | Actualiza un usuario | `req.params` + `req.body` |
| DELETE | `/api/usuarios/:id` | Elimina un usuario | `req.params` |

### Productos

| Método | Ruta | Descripción | Fuente de datos |
|--------|------|-------------|-----------------|
| GET | `/api/productos` | Lista todos | — |
| GET | `/api/productos?precioMin=100&precioMax=500` | Filtro por precio | `req.query` |
| GET | `/api/productos/:id` | Por ID | `req.params` |
| GET | `/api/productos/categoria/:categoria` | Por categoría | `req.params` |
| POST | `/api/productos` | Crea producto | `req.body` |
| PUT | `/api/productos/:id` | Actualiza | `req.params` + `req.body` |
| DELETE | `/api/productos/:id` | Elimina | `req.params` |

---

## 📋 Ejemplos con curl

### Obtener todos los usuarios
```bash
curl http://localhost:3000/api/usuarios
```

### Filtrar usuarios por rol (query param)
```bash
curl http://localhost:3000/api/usuarios?rol=admin
```

### Obtener usuario por ID (param de URL)
```bash
curl http://localhost:3000/api/usuarios/1
```

### Crear un usuario (datos en el body)
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Pedro Sánchez", "email": "pedro@ejemplo.com", "rol": "user"}'
```

### Actualizar un usuario (ID en URL + datos en body)
```bash
curl -X PUT http://localhost:3000/api/usuarios/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Ana García Actualizada"}'
```

### Eliminar un usuario
```bash
curl -X DELETE http://localhost:3000/api/usuarios/2
```

### Obtener productos por categoría (param de texto en URL)
```bash
curl http://localhost:3000/api/productos/categoria/tecnologia
```

### Filtrar productos por precio (query params)
```bash
curl "http://localhost:3000/api/productos?precioMin=100&precioMax=400"
```

### Crear un producto
```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Monitor 4K", "precio": 800, "categoria": "tecnologia", "stock": 3}'
```

---

## 🧠 Conceptos clave explicados

### req.params
Variables definidas con `:` en la ruta. Siempre son strings.
```
Ruta:  /usuarios/:id
URL:   /usuarios/42
→     req.params.id === "42"
```

### req.query
Parámetros opcionales después del `?` en la URL.
```
URL:  /usuarios?rol=admin&activo=true
→    req.query.rol    === "admin"
→    req.query.activo === "true"
```

### req.body
Cuerpo de la petición. Requiere el middleware `express.json()`.
```json
POST /usuarios
{ "nombre": "Ana", "email": "ana@test.com" }
→ req.body.nombre === "Ana"
```

### Middlewares
Funciones con firma `(req, res, next)` que se ejecutan entre la request y la response.
`next()` pasa el control al siguiente middleware o ruta.
