# ⬡ NeoBook Web

**Un revival open source del clásico NeoBook — ahora en el navegador.**

NeoBook fue un software de los años 90/2000 que permitía crear aplicaciones de escritorio usando comandos simples y una interfaz visual. Su empresa cerró y dejó de existir. Este proyecto lo revive como una app web moderna, sin instalación, gratis y open source.

![NeoBook Web Screenshot](https://raw.githubusercontent.com/your-username/neobook-web/main/preview.png)

## Demo

🌐 **[Abrir NeoBook Web](https://franciscovargascontardo.github.io/neobook-web/)**

---

## Características

- **Constructor visual drag & drop** — arrastra componentes al canvas
- **Motor de comandos NeoBook** — sintaxis familiar del original
- **Editor de scripts** integrado con resaltado de comandos
- **Consola de comandos** en tiempo real con historial
- **Panel de propiedades** por objeto seleccionado
- **Sistema de variables** con visor en vivo
- **Vista previa** de la aplicación construida
- **Exportar a HTML** — descarga tu app como archivo independiente
- **Multi-página** — soporte para 3 páginas por proyecto

## Componentes disponibles

| Control     | Gráfico  |
|-------------|----------|
| Botón       | Rectángulo |
| Campo texto | Círculo  |
| Etiqueta    | Línea    |
| Checkbox    | Imagen   |
| Lista (select) |       |
| Área de texto |       |

## Comandos NeoBook Web

```
GoPage <n>                      — Navegar a una página
ShowMessage "mensaje"           — Mostrar un mensaje al usuario
SetVariable nombre = "valor"    — Definir o modificar una variable
Print [variable] o "texto"      — Imprimir en la consola
GetInput prompt = "?" var = x   — Pedir input al usuario
PlaySound beep|<hz>             — Reproducir un tono
Loop <n> [ ... ]                — Repetir n veces
IfThen [var] = "x" [ ... ]      — Condicional simple
OpenURL "https://..."           — Abrir un enlace
ClearConsole                    — Limpiar la consola
ListVars                        — Listar todas las variables
Help                            — Mostrar ayuda completa
```

### Ejemplo de script

```
OnPageLoad [
  SetVariable saludo = "¡Bienvenido!"
  Print [saludo]
]

OnButtonClick btn_1 [
  GetInput prompt = "¿Tu nombre?" var = nombre
  ShowMessage "Hola " + [nombre]
  GoPage 2
]
```

## Uso rápido

1. Clona o descarga el repo
2. Abre `index.html` en cualquier navegador moderno
3. Sin instalación, sin dependencias externas (excepto Google Fonts)

```bash
git clone https://github.com/your-username/neobook-web.git
cd neobook-web
# Abre index.html en tu navegador
```

## Estructura del proyecto

```
neobook-web/
├── index.html    # Estructura HTML principal
├── style.css     # Estilos completos (dark theme)
├── app.js        # Lógica, motor de comandos, drag & drop
└── README.md
```

## GitHub Pages

Este proyecto está diseñado para funcionar directo en GitHub Pages — sin build steps, sin Node.js.

Para activarlo:
1. Ve a tu repo → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `root`
4. Guarda — tu app estará en `https://tu-usuario.github.io/neobook-web/`

## Roadmap

- [ ] Guardar/cargar proyectos (localStorage)
- [ ] Más comandos: `HTTPRequest`, `SaveFile`, `Timer`
- [ ] Integración con Claude AI (`AskAI "pregunta"`)
- [ ] Temas de color para el canvas
- [ ] Multi-página real con navegación entre páginas
- [ ] Exportar como app Electron

## Contribuir

Pull requests bienvenidos. Este es un proyecto comunitario para revivir una herramienta que mucha gente amó.

## Inspiración

[NeoBook](https://en.wikipedia.org/wiki/NeoBook) fue creado por NeoSoft Corp. La empresa cerró y el software ya no existe. Este proyecto no tiene afiliación con NeoSoft Corp — es un homenaje open source.

## Licencia

MIT — úsalo como quieras.
