'use strict';

const childProcess = require('child_process');
const path         = require('path');

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

    this.label  = null;
    this.player = null;
    this.url    = null;
    this.volume = null;

    this.stop   = this.stop.bind(this);
  }

  mute() {
    this.rpio.write(MUTE, this.rpio.LOW);
  }

  unmute() {
    this.rpio.write(MUTE, this.rpio.HIGH);
  }

  async playPodcast(podcast) {
    this.label = podcast.label;
    this.url   = podcast.url;

    await this.play();
  }

  async playFile(file) {
    this.label = path.basename(file);
    this.url   = file;

    await this.play();
  }

  async playStation(station) {
    if(!stations[station]) {
      throw new Error(`Unhandled station ${station}`);
    }

    this.label = station;
    this.url   = stations[station];

    await this.play();
  }

  getInitialVolume() {
    if(moment().hour() > 6 && moment().hour() < 22) {
      return 0.5;
    }

    return 0.15;
  }

  sendToPlayer(data) {
    if(!this.player) {
      return;
    }

    this.player.send(data);
  }

  async play() {
    if(this.player) {
      await this.stop();
    }

    this.volume = this.getInitialVolume();
    this.player = childProcess.fork('lib/streamPlayer.js', [this.url]);
    this.sendToPlayer({action: 'volume', level: this.volume});

    this.player.on('message', message => {
      // eslint-disable-next-line no-console
      console.log('message from player', message);
    });

    this.player.on('close', async() => {
      this.player = null;

      await this.stop();
    });

    this.mute();
    this.rpio.write(SHUTDOWN, this.rpio.HIGH);
    await delay(1000);
    this.unmute();
  }

  async stop() {
    if(this.player) {
      this.sendToPlayer({action: 'abort'});
    }

    this.mute();
    setTimeout(() => this.rpio.write(SHUTDOWN, this.rpio.LOW), 500);

    this.label = null;
    this.url   = null;

    while(this.player) {
      await delay(10);
    }
  }

  volumeDown() {
    if(!this.player) {
      return;
    }

    this.volume = _.max([this.volume * 0.9, 0.02]);
    this.sendToPlayer({action: 'volume', level: this.volume});
  }

  volumeUp() {
    if(!this.player) {
      return;
    }

    this.volume = _.min([this.volume * 1.1, 2]);
    this.sendToPlayer({action: 'volume', level: this.volume});
  }
}

module.exports = Stream;
