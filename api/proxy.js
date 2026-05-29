export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let originalUrl = req.url;

  // ✅ Parse properly using URL API to handle encoding correctly
  const parsed = new URL(originalUrl, 'http://localhost');
  let targetUrl = parsed.searchParams.get('targetUrl');

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing targetUrl query parameter' });
  }

  // ✅ Append remaining query params (e.g. &length=10) that aren't 'targetUrl'
  const extraParams = [];
  for (const [key, value] of parsed.searchParams.entries()) {
    if (key !== 'targetUrl') {
      extraParams.push(`${key}=${encodeURIComponent(value)}`);
    }
  }
  if (extraParams.length > 0) {
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + extraParams.join('&');
  }

  try {
    console.log('Proxying to:', targetUrl);

    const fetchHeaders = {
      'Content-Type': 'application/json',
      ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      ...(req.headers['ngrok-skip-browser-warning'] && { 'ngrok-skip-browser-warning': req.headers['ngrok-skip-browser-warning'] })
    };

    const fetchBody = (req.method !== 'GET' && req.body)
      ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
      : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: fetchHeaders,
      body: fetchBody
    });

    const data = await response.text();
    res.status(response.status);

    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch {
      res.send(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
}