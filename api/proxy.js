export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Accept either ?URL=... or ?targetUrl=...
  const raw = req.query?.URL ?? req.query?.targetUrl;

  if (typeof raw !== "string" || !raw.trim()) {
    return res.status(400).json({
      error: "Missing query parameter: provide ?URL=<encoded_url> (or ?targetUrl=...)",
    });
  }

  // If the URL is URL-encoded in the query string, decode it
  const decoded = decodeURIComponent(raw);

  // Replace only the first "&" with "?" (your original intent)
  const targetUrl = decoded.replace("&", "?");

  try {
    console.log("Proxying to:", targetUrl);

    const fetchHeaders = {
      ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      ...(req.headers["ngrok-skip-browser-warning"] && {
        "ngrok-skip-browser-warning": req.headers["ngrok-skip-browser-warning"],
      }),
      // Only set Content-Type if you actually send a body (avoid breaking some GETs)
      ...(req.method !== "GET" &&
        req.method !== "HEAD" &&
        req.body != null && { "Content-Type": "application/json" }),
    };

    const fetchBody =
      req.method !== "GET" && req.method !== "HEAD" && req.body != null
        ? typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body)
        : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: fetchHeaders,
      body: fetchBody,
    });

    const text = await response.text();
    res.status(response.status);

    // Return JSON if possible, otherwise raw text
    try {
      res.json(JSON.parse(text));
    } catch {
      res.send(text);
    }
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: error?.message ?? "Proxy failed" });
  }
}
