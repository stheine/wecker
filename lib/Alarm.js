'use strict';

class Alarm {
  constructor({stream}) {
    this.stream = stream;

    this.time = null;
    this.time = '12:00'; // TODO weg
  }

  off() {
    this.time = null;
  }

  set(time) {
    this.time = time;
  }
}

module.exports = Alarm;
