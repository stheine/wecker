'use strict';

/* eslint-disable no-underscore-dangle */

const childProcess = require('child_process');
const path         = require('path');

const _            = require('lodash');
const delay        = require('delay');
const moment       = require('moment');

const stations     = require('./stations');

const MUTE         = 35;
const SHUTDOWN     = 37;

const initialVolume = 0.05;

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

    this.stopAudio     = this.stopAudio.bind(this);
    this.stopStream    = this.stopStream.bind(this);
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

  async playPodcast(podcast) {
    await this.play({label: podcast.label, url: podcast.url, onStop: this.stopAudio});
  }

  async playPodcastList(episodeList) {
    this.playQueue = _.clone(episodeList);

    while(this.playQueue.length) {
      const podcast = this.playQueue.shift();

      await this.play({label: podcast.label, url: podcast.url});

      await new Promise(async resolve => {
        while(this.player) {
          await delay(100);
        }

        resolve();
      });
    }

    await this.stopAudio();
  }

  async playFile(file) {
    await this.play({label: path.basename(file), url: file, onStop: this.stopAudio});
  }

  async playStation(station) {
    if(!stations[station]) {
      throw new Error(`Unhandled station ${station}`);
    }

    await this.play({label: station, url: stations[station], onStop: this.stopAudio});
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

  async play({label, url, onStop}) {
    if(this.player) {
      await this.stopStream();
    }

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

      if(typeof onStop === 'function') {
        await onStop();
      }
    });

    this.mute();
    this.power();
    await delay(1000);
    this.unmute();

    this.paused = false;
  }

  async stopStream() {
    if(this.player) {
      this.sendToPlayer({action: 'abort'});
    }

    this.playQueue     = [];
    this.label         = null;
    this.paused        = null;
    this.url           = null;
    this.lastVolumeUse = moment();

    while(this.player) {
      await delay(10);
    }
  }

  async stopAudio() {
    this.mute();
    setTimeout(() => this.shutdown(), 100);
  }

  async next() {
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
