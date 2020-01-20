'use strict';

const delay  = require('delay');

const logger = require('./logger');

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
    process.on('exit', () => {
      // Workaround for the process not terminating on process.exit() due to input-event
      // calling fs.createReadStream() (which, for unknown reason, prevents exit).
      process.kill(process.pid, 'SIGTERM');
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

//  logger.info('Terminated loop');

    await this.terminate();
  }
}

module.exports = Loop;
