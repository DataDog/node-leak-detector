const leakDetector = require('./index.js');

function disableFlagIsSet(name) {
  if (name in process.env) {
    return process.env[name] === 'true';
  }

  return false;
}

const config = {
  requests: !disableFlagIsSet('DISABLE_LD_REQUESTS'),
};

/**
 * Iterate through each of the enabled detectors and print their status to STDERR in a sensible format.
 */
leakDetector.start(config, (detectors) => {
  if ('requests' in detectors) {
    const { starts, finishes, collections } = detectors.requests;

    let message = '';

    const inflight = starts - finishes;
    const uncollected = starts - collections;

    if (inflight) {
      message += `IN FLIGHT MESSAGES: ${inflight} `;
    }
    if (uncollected) {
      message += `UNCOLLECTED MESSAGES: ~${((uncollected / starts) * 100).toFixed(2)}% `;
    }
    console.error('REQUESTS: ' + (message || '100% ACCOUNTED FOR'));
  }
});