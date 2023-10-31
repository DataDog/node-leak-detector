# leak-detector

A memory/resource leak detector for Node.js applications.


## Usage

The `leak-detector` tool can be used to find resource leaks within your Node.js application. Run your application, make HTTP requests while using a load balancer, and keep an eye on the results. Note that there will be some performance overhead so it may be safest to test in staging or while observing production for short periods of time.

### Basic Usage

Here's a mostly code-free way to enable the leak detector:

```sh
npm install leak-detector
DISABLE_LD_MEMORY=true node -r leak-detector/all myapp.js
```

By default all of the leak detectors will be enabled when used in this manner.

Details about memory usage will be printed to STDERR.

### Advanced Usage

Here's how to enable it programmatically:

```javascript
const detector = require('leak-detector');

const detectors = {
  interval: 10, // 10s interval by default

  // specify which detectors to enable
  requests: true,
};

const handler = (detector, leaks) => {
  console.error(`LEAKS DETECTED (${detector}): `, leaks);
};

if (process.env.NODE_ENV === 'staging') {
  detector.start(detectors, handler);
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

This leak detector depends on the `FinalizationRegistry` feature of JavaScript. This is a feature that allows code to run when an object has been garbage collected but it comes with no guarantees that it will run when an object is collected. So far in my testing it seems pretty stable, but YMMV.

Chances are, an application is going to leak 100% of incoming requests or 0%. However, if there's something like an A/B test that runs on 33% of traffic, maybe the application would leak 33% or 67% of requests. If you have a code path that runs 1% of the time then it is likely indistinguishable from a margin of error. For testing purposes it's best to enable code paths 100% or 0% of the time to deterministically isolate a leak anyway.

Here's what the handler payload looks like:

```json
{
  "starts": 1000, // Number of incoming requests that have been recorded
  "finishes": 999, // Number of incoming requests that have completed
  "collections": 998 // Number of garbage collected incoming requests
}
```

The `starts` and `finishes` values are transmitted by the `http` module itself and are very accurate. In this case there is a single open request that the application is still dealing with.

The `collections` value is reported based on garbage collection events in the `FinalizationRegistry` and may have a margin of error. In this case the one active request hasn't been garbage collected yet since it's still in use. Another request also hasn't been garbage collected. It could be a leak, or it could get garbage collected if you were to manually call the `gc()` function (presuming `--enable-gc` is enabled).
