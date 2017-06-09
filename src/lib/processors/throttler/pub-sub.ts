import * as EventEmmiter from 'events';

abstract class PubSub extends EventEmmiter.EventEmitter {
  static PROCESSED = 'processed';
  constructor(public eventsPerPeriod: number, public periodInMS: number) {
    super();
  }

  abstract async subscribe(id: string, event: any, cb: Function, cb2: Function): Promise<boolean>;

  abstract async unsubscribe(id: string, result: any);

  abstract async getQueue();
}

export default PubSub;
