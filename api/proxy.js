export default async function handler(req, res) {
  // 1. Fix CORS: Use '*' to allow any custom header (or explicitly list them)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*'); 
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { rawUrl } = req.query;
  const targetUrl = rawUrl.replace("&", "?");
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing targetUrl query parameter' });
  }
  
  try {
    console.log('Proxying to:', targetUrl);
    
    // 2. Forward necessary headers to the target
    const fetchHeaders = {
      'Content-Type': 'application/json',
      ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      // You MUST forward the ngrok header, otherwise ngrok will block the proxy
      ...(req.headers['ngrok-skip-browser-warning'] && { 'ngrok-skip-browser-warning': req.headers['ngrok-skip-browser-warning'] })
    };

    // 3. Stringify the body if it's an object (Vercel parses req.body automatically)
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
