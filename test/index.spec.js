const { start, finish } = require("../index");
const DetectorIncomingRequests = require("../detector-incoming-requests");

jest.mock("../detector-incoming-requests");

describe("Node Leak Detector", () => {
  let mockConfig;
  let mockHandler;
  let mockDetectorInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      requests: true,
      interval: 1,
    };

    mockHandler = jest.fn();

    mockDetectorInstance = {
      start: jest.fn(),
      getStatus: jest.fn(() => ({
        starts: 1,
        finishes: 1,
        collections: 1,
      })),
      end: jest.fn(),
    };

    DetectorIncomingRequests.mockImplementation(() => mockDetectorInstance);

    jest.spyOn(global, "clearInterval");
    jest.spyOn(global, "setInterval");
  });

  afterEach(() => {
    finish();
    global.clearInterval.mockRestore();
    global.setInterval.mockRestore();
  });

  test("should initialize and start request detector if enabled", () => {
    start(mockConfig, mockHandler);
    expect(DetectorIncomingRequests).toHaveBeenCalledTimes(1);
    expect(mockDetectorInstance.start).toHaveBeenCalled();
  });

  test("should periodically call handler with detector statuses", (done) => {
    start(mockConfig, mockHandler);

    setTimeout(() => {
      expect(mockHandler).toHaveBeenCalledWith({
        requests: {
          starts: 1,
          finishes: 1,
          collections: 1,
        },
      });
      done();
    }, 1100);
  });

  test("should clear interval and stop detectors on finish", () => {
    start(mockConfig, mockHandler);
    finish();

    expect(global.clearInterval).toHaveBeenCalledTimes(1);
    expect(mockDetectorInstance.end).toHaveBeenCalledTimes(1);
  });
});
