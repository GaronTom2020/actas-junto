// Cloudflare Worker: guarda la clave de Gemini en secreto y responde solo a la página de Actas.
// Variables en Cloudflare: GEMINI_KEY (secreto) y ORIGEN (ej. https://garontom2020.github.io)
export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ORIGEN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST" || req.headers.get("Origin") !== env.ORIGEN)
      return new Response("No autorizado", { status: 403, headers: cors });

    const { prompt } = await req.json().catch(() => ({}));
    if (!prompt || prompt.length > 200000)
      return new Response("Pedido inválido", { status: 400, headers: cors });

    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
        })
      });
    const j = await r.json();
    const texto = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return Response.json({ texto, error: texto ? null : j.error?.message || "Sin respuesta" }, { headers: cors });
  }
};
