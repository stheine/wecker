'use strict';

const childProcess = require('child_process');

const _            = require('lodash');
const delay        = require('delay');
const moment       = require('moment');

const stations     = require('./stations');

const MUTE         = 35;
const SHUTDOWN     = 37;

class Stream {
  constructor({rpio}) {
    this.rpio = rpio;

    this.rpio.open(MUTE, rpio.OUTPUT, rpio.LOW);
    this.rpio.sleep(0.2);
    this.rpio.open(SHUTDOWN, rpio.OUTPUT, rpio.LOW);

    this.player = null;
    this.volume = null;
    this.url    = 'http://st01.dlf.de/dlf/01/128/mp3/stream.mp3';

    this.toggle = this.toggle.bind(this);
  }

  set(station) {
    if(!stations[station]) {
      throw new Error(`Unhandled station ${station}`);
    }

    this.url = stations[station];
  }

  getInitialVolume() {
    if(moment().hour() < 22) {
      return 0.5;
    }

    return 0.06;
  }

  async play() {
    if(this.player) {
      await this.stop();
    }

    this.volume = this.getInitialVolume();
    this.player = childProcess.fork('lib/streamPlayer.js', [this.url]);
    this.player.send({action: 'volume', level: this.volume});

//    this.player.on('message', message => {
//      console.log('message from player', message);
//    });

    this.rpio.write(MUTE, this.rpio.LOW);
    this.rpio.write(SHUTDOWN, this.rpio.HIGH);
    await delay(1000);
    this.rpio.write(MUTE, this.rpio.HIGH);
  }

  async stop() {
    if(this.player) {
      this.player.send({action: 'abort'});
      this.player = null;
    }

    this.rpio.write(MUTE, this.rpio.LOW);
    await delay(100);
    this.rpio.write(SHUTDOWN, this.rpio.LOW);

    this.player = null;
  }

  async toggle() {
    if(this.player) {
      await this.stop();
    } else {
      await this.play();
    }
  }

  volumeDown() {
    if(!this.player) {
      return;
    }

    this.volume = _.max([this.volume * 0.9, 0.02]);
    this.player.send({action: 'volume', level: this.volume});
  }

  volumeUp() {
    if(!this.player) {
      return;
    }

    this.volume = _.min([this.volume * 1.1, 2]);
    this.player.send({action: 'volume', level: this.volume});
  }
}

module.exports = Stream;
