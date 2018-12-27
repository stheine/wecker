'use strict';

const path = require('path');

const cron = require('node-cron');

class Alarm {
  constructor({data, stream}) {
    this.data   = data;
    this.stream = stream;

    this.task = null;
    this.time = data.data.alarm;
  }

  timeToCron(time) {
    const [hour, minute] = time.split(/:/);

    //      ┌────────────── second (optional)
    //      │ ┌──────────── minute
    //      │ │ ┌────────── hour
    //      │ │ │ ┌──────── day of month
    //      │ │ │ │ ┌────── month
    //      │ │ │ │ │ ┌──── day of week
    //      │ │ │ │ │ │
    //      │ │ │ │ │ │
    //      * * * * * *
    return `0 ${minute} ${hour} * * *`;
  }

  async wake() {
//    await this.stream.playFile(path.join('sounds', 'alarmClock.mp3'));
    await this.stream.playFile(path.join('sounds', 'pager.mp3'));
  }

  off() {
    this.data.set({alarm: null});
    this.time = null;

    this.task.destroy();
    this.task = null;
  }

  set(time) {
    this.data.set({alarm: time});
    this.time = time;

    this.task = cron.schedule(this.timeToCron(time), this.wake);
  }
}

module.exports = Alarm;
