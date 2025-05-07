let counter = 0;

function roundRobin(backends) {
  const backend = backends[counter % backends.length];
  counter++;
  return backend;
}

module.exports = { roundRobin };
