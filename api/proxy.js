export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Target-URL');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const targetUrl = req.headers['x-target-url'];
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing X-Target-URL header' });
  }
  
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization if present
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
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
    res.status(500).json({ error: error.message });
  }
}