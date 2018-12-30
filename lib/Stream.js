'use strict';

/* eslint-disable no-underscore-dangle */

const childProcess = require('child_process');
const path         = require('path');

const _            = require('lodash');
const delay        = require('delay');
const moment       = require('moment');

const podcasts     = require('./podcasts');
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
    this.paused = null;
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

  power() {
    this.rpio.write(SHUTDOWN, this.rpio.HIGH);
  }

  shutdown() {
    this.rpio.write(SHUTDOWN, this.rpio.LOW);
  }

  async getPodcastList(podcast) {
    if(!podcasts[podcast]) {
      throw new Error(`Unhandled podcast ${podcast}`);
    }

    const podcastList = await new Promise(resolve => {
      const subProcess = childProcess.fork('lib/getPodcastList.js', [podcasts[podcast]]);

      subProcess.on('message', message => {
        resolve(message.podcastList);
      });
    });

    return podcastList;
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

    return 0.20;
  }

  pause() {
    this.sendToPlayer({action: 'pause'});
    this.paused = true;
  }

  resume() {
    this.sendToPlayer({action: 'resume'});
    this.paused = false;
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
    this.power();
    await delay(1000);
    this.unmute();

    this.paused = false;
  }

  async stop() {
    if(this.player) {
      this.sendToPlayer({action: 'abort'});
    }

    this.mute();
    setTimeout(() => this.shutdown(), 100);

    this.label  = null;
    this.paused = null;
    this.url    = null;

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
