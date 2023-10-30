const dc = require('dc-polyfill');
const START_CHANNEL = 'http.server.request.start';
const FINISH_CHANNEL ='http.server.response.finish';

class DetectorIncomingRequests {
  starts = 0; // accurate
  finishes = 0; // accurate
  collections = 0; // approximate

  #registry = null; // FinalizationRegistry
  #subscribeStart = null; // ({response}) => void
  #subscribeFinish = null; // ({response}) => void

  constructor() {
    this.#registry = new FinalizationRegistry((_heldValue) => {
      this.collections++;
    });
  }

  start() {
    this.#subscribeStart = ({response}) => {
      this.starts++;
      this.#registry.register(response);
    };

    this.#subscribeFinish = () => { // { response }
      this.finishes++;
    };

    dc.subscribe(START_CHANNEL, this.#subscribeStart);
    dc.subscribe(FINISH_CHANNEL, this.#subscribeFinish);
  }

  end() {
    dc.unsubscribe(START_CHANNEL, this.#subscribeStart);
    dc.unsubscribe(FINISH_CHANNEL, this.#subscribeFinish);
  }

  getStatus() {
    return {
      starts: this.starts,
      finishes: this.finishes,
      collections: this.collections,
    };
  }
}

module.exports = DetectorIncomingRequests;