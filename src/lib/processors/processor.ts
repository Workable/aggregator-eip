import * as EventEmmiter from 'events';

abstract class Processor extends EventEmmiter.EventEmitter {
  protected name: string;
  protected id: string;
  protected input: any[];
  protected previous: Processor;

  constructor({name, input, id, previous}) {
    super();
    this.name = name;
    this.input = input;
    this.id = id;
    this.previous = previous;

    if (this.previous) {
      this.previous.on('event', event => this.safeProcess(event));
    }
  }

  async safeProcess(event) {
    await this.inject(() => this.process(event));
  }

  async inject(cb) {
    try {
      const result = await cb();
      if (result !== undefined) {
        this.emit('event', result);
      }
    } catch (e) {
      this.emit('error', e, cb);
    }
  }

  async abstract process(event: any);
}

export default Processor;
