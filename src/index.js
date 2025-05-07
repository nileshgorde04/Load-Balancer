const http = require('http');
const httpProxy = require('http-proxy');
const { backends, port } = require('./config');
const { roundRobin } = require('./balancer');

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  xfwd: true
});

// Add error handling for the proxy itself
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad gateway: ' + err.message);
  }
});

const server = http.createServer((req, res) => {
  const target = roundRobin(backends);
  console.log(`Proxying request to ${target}`);

  proxy.web(req, res, { target }, (err) => {
    console.error(`Error proxying to ${target}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad gateway: ' + err.message);
    }
  });
});

server.listen(port, () => {
  console.log(`Load balancer running at http://localhost:${port}`);
});
