# Adaptator TEA

Aplicación web para generar, adaptar y editar fichas educativas con apoyo visual para alumnado con TEA.

## Requisitos

- Node.js 18 o superior
- npm
- Opcional: Ollama si quieres usar modelo local

## Instalación

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación arranca normalmente en:

```text
http://localhost:5173
```

## Build de producción

```bash
npm run build
```

## Preview del build

```bash
npm run preview
```

## Configuración dentro de la app

Toda la configuración se hace desde la vista `Perfil`.

### Proveedor de IA

Puedes usar un solo proveedor activo a la vez:

- `Gemini API`
  - Configura `API key`
  - Configura el modelo, por ejemplo `gemini-2.5-flash`
- `Ollama local`
  - Configura la URL base, por defecto `http://localhost:11434`
  - Configura el modelo, por defecto `gemma4:e4b`

### Proveedor de pictogramas

Puedes cambiar entre:

- `ARASAAC oficial`
- `API privada`

La app ya está preparada para usar una API privada compatible con búsqueda de pictogramas.

## Uso básico

### Generar una ficha

1. Ve a `Generar Ficha`
2. Escribe el tema
3. Pulsa `Generar`

### Adaptar una ficha PDF

1. Ve a `Adaptar Ficha`
2. Sube un PDF
3. Pulsa `Adaptar con IA`

### Editar una ficha guardada

1. Ve a `Biblioteca`
2. Selecciona una ficha
3. Pulsa `Editar`
4. Haz clic sobre los pictogramas para cambiarlos
5. Usa el botón flotante del asistente IA para pedir cambios

## Logs de desarrollo

Cuando ejecutas `npm run dev`, la app muestra logs útiles para depurar:

- llamadas al proveedor de IA
- prompt enviado
- respuesta cruda del modelo
- búsquedas de pictogramas
- fases del proceso de generación

Las llamadas de IA en desarrollo pasan por un endpoint interno de Vite para que puedas ver esos logs en la terminal.

## Notas

- La app no bloquea el arranque si falta configuración de IA.
- Si el proveedor seleccionado no está bien configurado, fallarán solo las acciones de IA.
- Para usar Ollama desde el navegador, el endpoint debe ser accesible desde tu máquina y permitir el origen si aplica.
