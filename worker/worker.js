// Cloudflare Worker: guarda la clave de Gemini en secreto y responde solo a la página de Actas.
// Variables en Cloudflare: GEMINI_KEY (secreto) y ORIGEN (ej. https://garontom2020.github.io)
const PREFERIDO = "gemini-3.8-flash";
const API = "https://generativelanguage.googleapis.com/v1beta";

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

    const llamar = async modelo => {
      const r = await fetch(`${API}/models/${modelo}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
        })
      });
      const j = await r.json().catch(() => ({}));
      const texto = j.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim() || "";
      return { texto, status: r.status, error: j.error?.message };
    };

    // 1) Modelo preferido, con un reintento si está saturado
    let res = await llamar(PREFERIDO);
    if (!res.texto && [429, 500, 503].includes(res.status)) {
      await new Promise(ok => setTimeout(ok, 1500));
      res = await llamar(PREFERIDO);
    }

    // 2) Si sigue fallando, probar otros modelos Flash disponibles para esta clave
    if (!res.texto && [404, 429, 500, 503].includes(res.status)) {
      const lista = await fetch(`${API}/models?pageSize=200`, { headers: { "x-goog-api-key": env.GEMINI_KEY } })
        .then(r => r.json()).catch(() => ({}));
      const alternativas = (lista.models || [])
        .filter(m => /flash/.test(m.name) && !/image|tts|audio|live|embedding/.test(m.name)
          && (m.supportedGenerationMethods || []).includes("generateContent"))
        .map(m => m.name.replace("models/", ""))
        .filter(n => n !== PREFERIDO)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
        .slice(0, 4);
      for (const m of alternativas) {
        res = await llamar(m);
        if (res.texto) break;
      }
    }

    return Response.json({ texto: res.texto, error: res.texto ? null : res.error || "Sin respuesta" }, { headers: cors });
  }
};
