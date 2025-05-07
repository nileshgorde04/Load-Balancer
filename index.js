const http = require('http');
const httpProxy = require('http-proxy');
const url = require('url');
const { program } = require('commander');

// Parse command line arguments
program
  .option('-p, --port <number>', 'Port to run the load balancer on', 3000)
  .option('-s, --servers <items>', 'Comma-separated list of backend servers', 'http://localhost:8080,http://localhost:8081')
  .option('-c, --check-interval <number>', 'Health check interval in milliseconds', 10000)
  .option('-u, --health-url <string>', 'URL path for health checks', '/')
  .parse(process.argv);

const options = program.opts();

// Convert servers string to array
const backendServers = options.servers.split(',');

// Create a proxy server
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  xfwd: true
});

// Track server health status
const serverStatus = {};
backendServers.forEach(server => {
  serverStatus[server] = { healthy: true, lastCheck: Date.now() };
});

// Counter for round-robin load balancing
let currentServerIndex = 0;

// Round-robin server selection from healthy servers
function getNextHealthyServer() {
  const healthyServers = backendServers.filter(server => serverStatus[server].healthy);
  
  if (healthyServers.length === 0) {
    return null;
  }
  
  const server = healthyServers[currentServerIndex % healthyServers.length];
  currentServerIndex++;
  return server;
}

// Health check function
function checkServerHealth(server) {
  const parsedUrl = url.parse(server);
  const healthCheckUrl = `${server}${options.healthUrl}`;
  
  const req = http.request(
    {
      host: parsedUrl.hostname,
      port: parsedUrl.port,
      path: options.healthUrl,
      method: 'GET',
      timeout: 5000
    },
    (res) => {
      const healthy = res.statusCode === 200;
      const wasHealthy = serverStatus[server].healthy;
      
      serverStatus[server] = { 
        healthy, 
        lastCheck: Date.now() 
      };
      
      if (healthy !== wasHealthy) {
        console.log(`Server ${server} is now ${healthy ? 'healthy' : 'unhealthy'}`);
      }
      
      // Consume response data to free up memory
      res.resume();
    }
  );
  
  req.on('error', (err) => {
    const wasHealthy = serverStatus[server].healthy;
    serverStatus[server] = { 
      healthy: false, 
      lastCheck: Date.now() 
    };
    
    if (wasHealthy) {
      console.log(`Server ${server} is now unhealthy: ${err.message}`);
    }
  });
  
  req.on('timeout', () => {
    req.abort();
  });
  
  req.end();
}

// Start health checks
function startHealthChecks() {
  setInterval(() => {
    backendServers.forEach(server => {
      checkServerHealth(server);
    });
  }, options.checkInterval);
  
  // Initial health check
  backendServers.forEach(server => {
    checkServerHealth(server);
  });
}

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`Bad Gateway: ${err.message}`);
  }
});

// Create HTTP server
const server = http.createServer((req, res) => {
  const target = getNextHealthyServer();
  
  if (!target) {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Service Unavailable: No healthy backend servers available');
    return;
  }
  
  console.log(`Proxying request to ${target}`);
  
  proxy.web(req, res, { target }, (err) => {
    console.error(`Error proxying to ${target}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Bad Gateway: ${err.message}`);
    }
  });
});

// Start the server
server.listen(options.port, () => {
  console.log(`Load balancer running at http://localhost:${options.port}`);
  console.log(`Backend servers: ${backendServers.join(', ')}`);
  console.log(`Health check interval: ${options.checkInterval}ms`);
  console.log(`Health check URL: ${options.healthUrl}`);
  
  // Start health checks
  startHealthChecks();
});