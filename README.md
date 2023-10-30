# leak-detector

A memory/resource leak detector for Node.js applications.


## Usage

The `leak-detector` tool can be used to find resource leaks within your Node.js application. Run your application, make HTTP requests while using a load balancer, and keep an eye on the results. Note that there will be some performance overhead so it may be safest to test in staging or while observing production for short periods of time.

### Basic Usage

Here's a mostly code-free way to enable the leak detector:

```sh
npm install leak-detector
DISABLE_LD_REQUESTS=memory node -r leak-detector/auto myapp.js
```

By default all of the leak detectors will be enabled when used in this manner.

Details about memory usage will be printed to STDERR.

### Advanced Usage

Here's how to enable it programmatically:

```javascript
const detector = require('leak-detector');

const detectors = {
  interval: 10, // 10s interval by default

  // list which detectors to enable
  requests: true,
};

const handler = (detector, leaks) => {
  // TODO: document the `leaks` variable
  console.error(`LEAKS DETECTED (${detector}): ${leaks.count}`);
};

if (process.env.NODE_ENV === 'staging') {
  detector.start(detectors, handler);
  // detector.finish();
}
```


## Detectors

Here's a list of detectors supported by this tool.

The "config" column specifies the `detectors` flag name used for enabling the detector. When using this tool programmatically all of the detectors are disabled by default unless manually enabled.

The "environment variable" column specifies the name of the environment variable used to disable the detector. When using this by injecting via command line all of the detectors are enabled by default.

| Detector          | Config     | Environment Variable  |
|-------------------|------------|-----------------------|
| Incoming Requests | `requests` | `DISABLE_LD_REQUESTS` |

Currently we only support detection of one type of resource leak. We plan on adding more. Pull requests welcome.

### Incoming Requests Leak Detection

This leak detector depends on the `FinalizationRegistry` feature of JavaScript. This is a tool that allows code to run when an object has been garbage collected but it comes with no guarantees that it will run when an object is collected. Indeed, with our testing, it appears to be about 99% accurate. So, if 1,000,000 incoming requests are allocated and garbage collected, there might only be 990,000 triggered cleanup events. For this reason it's not beneficial to look at the raw number but instead the percentage of overall incoming requests that have leaked. This value might change based on OS, architecture, and workload, so you may need to test this on your own infrastructure to find out.

Chances are, an application is going to leak 100% of incoming requests or 0%. However, if there's something like an A/B test that runs on 33% of traffic, maybe the application would leak 33% or 67% of requests. If you have a code path that runs 1% of the time then it is likely indistinguishable from the margin of error. For testing purposes it's best to enable code paths 100% or 0% of the time to deterministically isolate a leak anyway.
