const http = require('http');

// Create a simple HTML response
const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Backend Server 3</title>
  </head>
  <body>
    <h1>Hello from the web server running on port 8082.</h1>
    <p>This is Backend Server 3</p>
  </body>
</html>
`;

// Create server
const server = http.createServer((req, res) => {
  console.log(`Received request from ${req.socket.remoteAddress}`);
  console.log(`${req.method} ${req.url} HTTP/${req.httpVersion}`);
  
  // Log headers
  Object.keys(req.headers).forEach(key => {
    console.log(`${key}: ${req.headers[key]}`);
  });
  
  // Set response headers
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': Buffer.byteLength(html)
  });
  
  // Send response
  res.end(html);
  
  console.log('Replied with HTML content');
});

// Start server
const PORT = 8082;
server.listen(PORT, () => {
  console.log(`Backend Server 3 running at http://localhost:${PORT}/`);
});