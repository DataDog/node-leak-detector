const DetectorIncomingRequests = require("../detector-incoming-requests");
const dc = require("dc-polyfill");

jest.mock("dc-polyfill", () => ({
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
}));

describe("DetectorIncomingRequests", () => {
  let detector;

  beforeEach(() => {
    detector = new DetectorIncomingRequests();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize counters to zero", () => {
    expect(detector.starts).toBe(0);
    expect(detector.finishes).toBe(0);
    expect(detector.collections).toBe(0);
  });

  test("should subscribe to start and finish channels on start", () => {
    detector.start();

    expect(dc.subscribe).toHaveBeenCalledWith(
      "http.server.request.start",
      expect.any(Function)
    );
    expect(dc.subscribe).toHaveBeenCalledWith(
      "http.server.response.finish",
      expect.any(Function)
    );
  });

  test("should unsubscribe from start and finish channels on end", () => {
    detector.start();
    detector.end();

    expect(dc.unsubscribe).toHaveBeenCalledWith(
      "http.server.request.start",
      expect.any(Function)
    );
    expect(dc.unsubscribe).toHaveBeenCalledWith(
      "http.server.response.finish",
      expect.any(Function)
    );
  });

  test("should increment starts counter on request start", () => {
    detector.start();

    dc.subscribe.mock.calls[0][1]({ response: {} });

    expect(detector.starts).toBe(1);
  });

  test("should increment finishes counter on request finish", () => {
    detector.start();

    dc.subscribe.mock.calls[1][1]({});

    expect(detector.finishes).toBe(1);
  });

  test("should increment collections counter on garbage collection", () => {
    detector.start();

    detector["#registry"] = {
      register: jest.fn(),
      gc: jest.fn().mockImplementation(() => detector.collections++),
    };

    const response = {};
    detector["#registry"].register(response);
    detector["#registry"].gc();

    expect(detector.collections).toBe(1);
  });

  test("should return correct status after making allocations and deallocations", () => {
    detector.start();

    for (let i = 0; i < 5; i++) {
      dc.subscribe.mock.calls[0][1]({ response: {} });
    }

    for (let i = 0; i < 3; i++) {
      dc.subscribe.mock.calls[1][1]({});
    }

    detector["#registry"] = {
      register: jest.fn(),
      gc: jest.fn().mockImplementation(() => detector.collections++),
    };

    for (let i = 0; i < 2; i++) {
      detector["#registry"].register({});
      detector["#registry"].gc();
    }

    const status = detector.getStatus();

    expect(status.starts).toBe(5);
    expect(status.finishes).toBe(3);
    expect(status.collections).toBe(2);
  });
});
