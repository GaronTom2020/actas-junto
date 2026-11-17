# Actas · Junto

Herramienta web de **Junto · Círculo de Ciencias Políticas · UCEMA** para grabar reuniones, transcribirlas, identificar quién habló y armar un resumen breve con temas y compromisos, listo para pegar en WhatsApp.

- **Transcripción:** Whisper (small) corre dentro del navegador. El audio no sale del dispositivo.
- **Voces:** pyannote separa la grabación por hablante; cada uno se asigna a mano desde la lista de asistentes.
- **Resumen:** Gemini, a través de un Cloudflare Worker que guarda la clave en secreto.
- **Revisión:** cada compromiso muestra la frase textual que lo respalda, y la página marca los dudosos.
- **App instalable:** funciona como app en Android e iPhone (manifest + service worker).

## Puesta en marcha

1. **Clave de Gemini:** sacala gratis en [Google AI Studio](https://aistudio.google.com/apikey).
2. **Worker:** en Cloudflare, *Workers & Pages → Create → Worker*. Pegá `worker/worker.js`. En *Settings → Variables* agregá:
   - `GEMINI_KEY` (tipo *Secret*): tu clave.
   - `ORIGEN`: `https://garontom2020.github.io` (sin barra final).
3. **Conectar:** en `index.html`, reemplazá `https://TU-WORKER.workers.dev` por la dirección del Worker.
4. **Publicar:** *Settings → Pages →* rama `main`, carpeta `/ (root)`.
5. **Probar:** grabá unos minutos con dos o tres personas, en computadora y en celular.

## Instalar en el celular

- **Android:** abrir la página en Chrome → menú → *Instalar app*.
- **iPhone:** abrir en Safari → *Compartir* → *Agregar a inicio*.

La primera vez descarga los modelos (unos cientos de MB): conviene wifi. Después quedan guardados en el navegador.

## Límites a tener en cuenta

- La separación de voces falla más cuando dos personas hablan a la vez o con mucho ruido.
- En reuniones largas, la transcripción en el celular puede ser lenta: rinde mejor en computadora.
- Al cambiar algo, subí la versión en la primera línea de `sw.js` (`v1` → `v2`).

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | La app |
| `manifest.json`, `sw.js` | Instalación como app |
| `icono-*.png`, `apple-touch-icon.png`, `favicon.png`, `junto-avatar-nogal.png` | Ícono: avatar oficial de Junto (fondo nogal) |
| `worker/worker.js` | Código del Cloudflare Worker |
