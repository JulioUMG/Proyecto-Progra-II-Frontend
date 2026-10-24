# Frontend del hotel en Render

## Por qué un Web Service

El navegador utiliza el mismo dominio para la página y sus peticiones. Nginx muestra React y reenvía las rutas del backend; esto conserva la sesión sin depender de cookies entre sitios distintos.
No hay cambios de diseño ni de textos en las páginas.

## Crear el servicio

1. Publicar primero el backend y comprobar su ruta /api/public/salud.
2. Render > New > Web Service, conectar el repositorio del frontend.
3. Language: Docker. Root Directory: vacío si package.json está en la raíz del repositorio.
4. Dockerfile Path: ./Dockerfile. Plan: Free.
5. Variable BACKEND_HOST: dominio público real del backend, por ejemplo hotel-rincon-backend.onrender.com. Sin https://, puerto, espacios ni barra final.
6. Health Check Path: /salud.
7. Crear el servicio y abrir la URL pública del frontend.

No crear este frontend como Static Site: esta configuración necesita Nginx.
No configurar VITE_API_URL con el dominio del backend. El Dockerfile lo deja vacío para utilizar el mismo sitio.
No se necesitan reglas de rewrite en el panel: nginx.conf.template ya permite recargar /login y /sistema.
Nunca poner credenciales de MySQL en el frontend.

## Archivos

- Dockerfile: compila con Node 24 y sirve dist con Nginx.
- nginx.conf.template: envía las peticiones de la API al backend y las demás rutas a React.
- .dockerignore: excluye dependencias locales, compilados y archivos privados.

## Pruebas en la nube

1. Abrir / y comprobar fotos, navegación y menú móvil.
2. Abrir /api/public/salud desde el dominio del frontend: debe responder OK en JSON.
3. Buscar disponibilidad.
4. Iniciar sesión con una cuenta importada y recargar /sistema.
5. Crear una reserva con datos de prueba y comprobar que aparece en recepción.
6. Comprobar reportes PDF y Excel; cancelar la reserva de prueba al terminar si corresponde.
7. Cerrar sesión y comprobar que el área del sistema pide login.

## Límites gratuitos

Son dos Web Services Free. Comparten las 750 horas mensuales gratuitas del workspace; no son 750 por servicio. Si ambos funcionaran continuamente, no alcanzarían para todo el mes. Se suspenden por inactividad y pueden tardar alrededor de un minuto en despertar, a veces más al encender ambos. Si se agotan las horas, Render suspende los servicios gratuitos hasta el siguiente mes. Revisar Usage antes de la exposición.
Aiven conserva los datos fuera de Render; no se usa H2 en la nube. Aiven puede apagar el servicio gratuito por inactividad.
Las sesiones pueden perderse al reiniciarse el backend: volver a iniciar sesión.
