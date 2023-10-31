let interval = null;

const DetectorIncomingRequests = require('./detector-incoming-requests.js');

const enabled = {};

module.exports.start = (config, handler) => {
  if (interval) clearInterval(interval);

  if (config.requests) {
    enabled.requests = new DetectorIncomingRequests();
    enabled.requests.start();
  }

  interval = setInterval(() => {
    const statuses = {};

    for (let [name, detector] of Object.entries(enabled)) {
      const status = detector.getStatus();
      statuses[name] = status;
    }

    handler(statuses);
  }, config.interval || 10_000).unref();
};

module.exports.finish = () => {
  clearInterval(interval);

  if ('requests' in enabled) {
    enabled.requests.end();
  }
};