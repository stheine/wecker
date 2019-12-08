'use strict';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */

const childProcess = require('child_process');
const path         = require('path');

const _            = require('lodash');
const delay        = require('delay');
const moment       = require('moment');

const stations     = require('./stations');

const MUTE         = 35;
const SHUTDOWN     = 37;

const initialVolume = 0.2;

class Stream {
  constructor({rpio}) {
    this.rpio = rpio;

    this.rpio.open(MUTE, rpio.OUTPUT, rpio.LOW);
    this.rpio.sleep(0.2);
    this.rpio.open(SHUTDOWN, rpio.OUTPUT, rpio.LOW);

    this.label         = null;
    this.player        = null;
    this.paused        = null;
    this.url           = null;
    this.volume        = initialVolume;
    this.lastVolumeUse = moment();
    this.playQueue     = [];
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

  async getEpisodeList(podcast) {
    const episodeList = await new Promise(resolve => {
      const subProcess = childProcess.fork('lib/getEpisodeList.js', [podcast.url]);

      subProcess.on('message', message => {
        resolve(message.episodeList);
      });
    });

    return episodeList;
  }

  async stopAudio() {
    this.mute();
    await delay(100);
    this.shutdown();
  }

  async play({label, url}) {
    const volume = this.getInitialVolume();

    this.label  = label;
    this.url    = url;
    this.player = childProcess.fork('lib/streamPlayer.js', [this.url]);
    this.sendToPlayer({action: 'volume', level: volume});

    this.player.on('message', message => {
      // eslint-disable-next-line no-console
      console.log('message from player', message);
    });

    this.player.on('close', async() => {
      this.player = null;
    });

    this.power();
    await delay(100);
    this.unmute();

    this.paused = false;
  }

  async startPlayQueue() {
    if(this.player) {
      this.sendToPlayer({action: 'abort'});

      return;
    }

    while(this.playQueue.length) {
      const queueItem = this.playQueue.shift();

      await this.play(queueItem);

      await new Promise(async resolve => {
        while(this.player) {
          await delay(100);
        }

        resolve();
      });
    }

    this.label         = null;
    this.paused        = null;
    this.url           = null;
    this.lastVolumeUse = moment();

    while(this.player) {
      await delay(10);
    }

    await this.stopAudio();
  }

  async playPodcast(podcast) {
    this.playQueue = [podcast];

    this.startPlayQueue();
  }

  async playPodcastList(episodeList) {
    this.playQueue = _.clone(episodeList);

    this.startPlayQueue();
  }

  async playFile(file) {
    this.playQueue = [{label: path.basename(file), url: file}];

    this.startPlayQueue();
  }

  async playStation(station) {
    if(!stations[station]) {
      throw new Error(`Unhandled station ${station}`);
    }

    this.playQueue = [{label: station, url: stations[station]}];

    this.startPlayQueue();
  }

  getInitialVolume() {
    const expire = moment().subtract(30, 'minutes');

    if(this.lastVolumeUse.isBefore(expire)) {
      this.volume = initialVolume;

      this.lastVolumeUse = moment();
    }

    return this.volume;
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

  async next() {
    if(this.player) {
      this.sendToPlayer({action: 'abort'});
    }
  }

  async stopStream() {
    this.playQueue = [];

    if(this.player) {
      this.sendToPlayer({action: 'abort'});
    }
  }

  volumeDown() {
    if(!this.player) {
      return;
    }

    this.volume = _.max([this.volume * 0.9, 0.02]);
    this.sendToPlayer({action: 'volume', level: this.volume});

    this.lastVolumeUse = moment();
  }

  volumeUp() {
    if(!this.player) {
      return;
    }

    this.volume = _.min([this.volume * 1.1, 2]);
    this.sendToPlayer({action: 'volume', level: this.volume});

    this.lastVolumeUse = moment();
  }
}

module.exports = Stream;
