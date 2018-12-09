'use strict';

const childProcess = require('child_process');

const _            = require('lodash');
const delay        = require('delay');
const moment       = require('moment');

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
    switch(station) {
      case 'Burn FM':    this.url = 'http://burnfm.radionetz.de:8000/burn-fm.mp3'; break;
      case 'DLF':        this.url = 'http://st01.dlf.de/dlf/01/128/mp3/stream.mp3'; break;
      case 'DLF Kultur': this.url = 'http://st02.dlf.de/dlf/02/128/mp3/stream.mp3'; break;
      case 'DLF Nova':   this.url = 'http://st03.dlf.de/dlf/03/128/mp3/stream.mp3'; break;
      case 'SWR3':       this.url = 'http://swr-swr3-live.cast.addradio.de/swr/swr3/live/mp3/128/stream.mp3'; break;
      case 'SWR3 Rock':  this.url = 'http://swr-swr-raka05.cast.addradio.de/swr/swr/raka05/mp3/128/stream.mp3'; break;

      default: throw new Error(`Unhandled station ${station}`);
    }
  }

  getInitialVolume() {
    if(moment().hour() < 22) {
      return 1;
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
