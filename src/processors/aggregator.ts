import Processor from './processor';
import AggregationStrategy from './aggregator/aggregation-strategy';
import MaxNumStrategy from './aggregator/max-num-strategy';
import Store from './aggregator/store';
import MemoryStore from './aggregator/memory-store';
import Timer from './aggregator/timer';
import MemoryTimer from './aggregator/memory-timer';

export default class Aggregator extends Processor {
  private strategy: AggregationStrategy;
  private store: Store;
  private timer: Timer;

  constructor(options) {
    super(options);
    const {timeout = [1000]} = this.input[0];
    const {strategy = new MaxNumStrategy(3), store = new MemoryStore(), timer = new MemoryTimer(timeout) } = this.input[0] || {};
    this.strategy = strategy;
    this.store = store;
    this.timer = <any>timer;

    this.strategy.on('event', (event, status) => this.aggregate(event, status));
    this.timer.on('event', (id, attempt) => {
      const event = this.store.getById(id);
      event.headers.attempt = attempt;
      this.aggregate(event, Store.STATUS.TIMEOUT);
    });
  }

  getId(event) {
    return event.headers.id;
  }

  getBody(event) {
    return event.body;
  }

  getHeaders(event) {
    const {id, ...headers} = event.headers;
    return headers;
  }

  async aggregate(event, status) {
    const {body, headers} = await this.store.setStatus(this.getId(event), status);
    this.emit('event', { body, headers: { ...headers, previousStatus: event.headers.status } })
  }

  async process(event) {
    const {body, headers} = await this.store.append(this.getId(event), this.getHeaders(event), this.getBody(event));
    if (body.length === 1) {
      this.timer.start(this.getId(event));
    }
    await this.strategy.check({ body, headers });
  }
}