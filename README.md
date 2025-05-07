# Load Balancer

A simple HTTP load balancer built with Node.js that distributes client requests across multiple backend servers using a round-robin algorithm. It includes health checks to ensure requests are only sent to healthy servers.

## Features

- Round-robin load balancing across multiple backend servers
- Periodic health checks to detect server availability
- Automatic removal of unhealthy servers from the rotation
- Automatic re-addition of servers when they become healthy again
- Configurable health check interval and URL
- Detailed logging of requests and server status

## Requirements

- Node.js (v12 or higher)
- npm

## Installation

1. Clone this repository or download the source code
2. Install dependencies:

```bash
npm install
```

## Configuration

The load balancer can be configured using command-line arguments:

- `-p, --port <number>`: Port to run the load balancer on (default: 3000)
- `-s, --servers <items>`: Comma-separated list of backend servers (default: "http://localhost:8080,http://localhost:8081")
- `-c, --check-interval <number>`: Health check interval in milliseconds (default: 10000)
- `-u, --health-url <string>`: URL path for health checks (default: "/")

## Usage

### Starting the Backend Servers

The project includes three sample backend servers that listen on ports 8080, 8081, and 8082. You can start them individually:

```bash
npm run backend1
npm run backend2
npm run backend3
```

Or start all of them at once:

```bash
npm run start-backends
```

### Starting the Load Balancer

To start the load balancer with default settings:

```bash
npm start
```

Or with custom settings:

```bash
node index.js --port 3000 --servers "http://localhost:8080,http://localhost:8081,http://localhost:8082" --check-interval 5000 --health-url "/health"
```

### Starting Everything Together

To start all backend servers and the load balancer at once:

```bash
npm run start-all
```

## Testing

### Basic Testing

Once everything is running, you can test the load balancer by sending requests to it:

```bash
curl http://localhost:3000/
```

Send multiple requests to see the round-robin distribution in action:

```bash
curl http://localhost:3000/
curl http://localhost:3000/
curl http://localhost:3000/
```

### Testing Health Checks

To test the health check functionality:

1. Start all backend servers and the load balancer
2. Send several requests to verify round-robin distribution
3. Stop one of the backend servers (e.g., press Ctrl+C in the terminal running backend1.js)
4. Wait for the health check interval to pass
5. Send more requests - they should only be distributed to the remaining healthy servers
6. Restart the stopped server
7. Wait for the health check interval to pass
8. Send more requests - they should now include the restarted server in the distribution

### Testing Concurrent Requests

To test how the load balancer handles concurrent requests, you can use curl's parallel request feature:

1. Create a file named `urls.txt` with the following content:

```
url = "http://localhost:3000"
url = "http://localhost:3000"
url = "http://localhost:3000"
url = "http://localhost:3000"
url = "http://localhost:3000"
url = "http://localhost:3000"
url = "http://localhost:3000"
url = "http://localhost:3000"
```

2. Run the following command:

```bash
curl --parallel --parallel-immediate --parallel-max 3 --config urls.txt
```

You can adjust the `--parallel-max` value to test different levels of concurrency.

## License

ISC