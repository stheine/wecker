import {setTimeout as delay} from 'node:timers/promises';

import logger                from './logger.js';

class Loop {
  constructor({alarm, input, logic, mqtt}) {
    this.alarm = alarm;
    this.input = input;
    this.logic = logic;
    this.mqtt  = mqtt;

    this.running = true; // TODO

    process.on('SIGINT', () => {
      logger.info('Caught SIGINT');

      this.running = false;
    });
    process.on('SIGTERM', () => {
      logger.info('Caught SIGTERM');

      this.running = false;
    });
    process.on('exit', () => {
      logger.info('process.on(exit)');
      // Workaround for the process not terminating on process.exit() due to input-event
      // calling fs.createReadStream() (which, for unknown reason, prevents exit).
      process.kill(process.pid, 'SIGKILL');
      process.kill(process.pid, 'SIGKILL');
      process.kill(process.pid, 'SIGTERM');
      process.kill(process.pid, 'SIGTERM');
      logger.warn('killed', process.pid);
    });
  }

  async terminate() {
    logger.info('Loop:terminate');

    this.alarm.terminate();
    this.input.terminate();
    this.logic.terminate();
    await this.mqtt.terminate();
  }

  async start() {
    while(this.running) {
//    logger.info('loop start');

      await this.logic.refresh();

      await delay(80);

//    logger.info('loop finish');
    }

    logger.info('Terminated loop');

    await this.terminate();
  }
}

export default Loop;
