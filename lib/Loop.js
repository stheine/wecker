'use strict';

/* eslint-disable no-console */

const delay = require('delay');

class Loop {
  constructor({alarm, input, logic, mqtt}) {
    this.alarm = alarm;
    this.input = input;
    this.logic = logic;
    this.mqtt  = mqtt;

    this.running = true; // TODO

    process.on('SIGINT', () => {
      console.log('Caught SIGINT');

      this.running = false;
    });
    process.on('exit', () => {
      // Workaround for the process not terminating on process.exit() due to input-event
      // calling fs.createReadStream() (which, for unknown reason, prevents exit).
      process.kill(process.pid, 'SIGTERM');
    });
  }

  async terminate() {
    console.log('Loop:terminate');

    this.alarm.terminate();
    this.input.terminate();
    this.logic.terminate();
    await this.mqtt.terminate();
  }

  async start() {
    while(this.running) {
//    console.log('loop start');

      await this.logic.refresh();

      await delay(80);

//    console.log('loop finish');
    }

//  console.log('Terminated loop');

    await this.terminate();
  }
}

module.exports = Loop;
