'use strict';

const childProcess = require('child_process');

const _            = require('lodash');
const delay        = require('delay');

const MUTE         = 35;
const SHUTDOWN     = 37;

class Stream {
  constructor({rpio}) {
    this.playing = false;

    this.rpio = rpio;

    this.rpio.open(MUTE, rpio.OUTPUT, rpio.LOW);
    this.rpio.sleep(0.2);
    this.rpio.open(SHUTDOWN, rpio.OUTPUT, rpio.LOW);

    this.player = null;
    this.volume = 0.06;

    this.toggle = this.toggle.bind(this);
  }

  async toggle() {
    if(this.playing) {
      if(this.player) {
        this.player.send({action: 'abort'});
        this.player = null;
      }

      this.rpio.write(MUTE, this.rpio.LOW);
      await delay(100);
      this.rpio.write(SHUTDOWN, this.rpio.LOW);

      this.playing = false;
    } else {
      this.player = childProcess.fork('lib/streamPlayer.js');
      this.volume = 0.06;
      this.player.send({action: 'volume', level: this.volume});

//      this.player.on('message', message => {
//        console.log('message from player', message);
//      });

      this.rpio.write(MUTE, this.rpio.LOW);
      this.rpio.write(SHUTDOWN, this.rpio.HIGH);
      await delay(1000);
      this.rpio.write(MUTE, this.rpio.HIGH);

      this.playing = true;
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
