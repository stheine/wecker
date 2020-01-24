'use strict';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
/* eslint-disable unicorn/consistent-function-scoping */

const childProcess = require('child_process');
const fs           = require('fs');
const path         = require('path');

const _            = require('lodash');
const delay        = require('delay');
const moment       = require('moment');
const mpg123       = require('mpg123');
const request      = require('request-promise-native');
const xmlJs        = require('xml-js');

const logger       = require('./logger');
const stations     = require('./stations');

const MUTE         = 36; // Miniamp, GPIO 16
const SHUTDOWN     = 37; // Miniamp, GPIO 26

const initialVolume = 10;

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

  async sendToPlayer(data) {
    if(!this.player) {
      return;
    }

    let {action, param} = data;

    const command = `${action}${param ? ` ${param}` : ''}`;

    logger.info('sendToPlayer', command);

    if(!_.isFunction(this.player[action])) {
      logger.warn(`mpg123 player.${action} is not a function`);

      return;
    }

    try {
      this.player[action](param);
    } catch(err) {
      logger.error('Unexpected error in mpg123 player', err.message);

      this.player = null;
    }
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
    logger.info('Stream:getEpisodeList');

    const xml   = await request.get(podcast.url);
    const rss   = xmlJs.xml2js(xml, {compact: true});
    const items = _.slice(rss.rss.channel.item, 0, 10);
    let   getLabel;

    if(podcast.label === 'Nachrichten') {
      getLabel = item => item.pubDate._text
        .replace(/^\w+, \d+ \w+ \d+ /, '')
        .replace(/:\d+ \+\d+$/, '');
    } else {
      getLabel = item => item.title._text;
    }

    const episodeList = _.map(items, item => _.assign(item, {
      episodeLabel: getLabel(item),
    }));

    logger.info('Stream:getEpisodeList', episodeList);

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
    this.url    = url.replace(/^https/, 'http');

    logger.info('Stream:play', this.url);

    this.player = new mpg123.MpgPlayer(null, true);
 
    await this.sendToPlayer({action: 'volume', param: volume});
    await this.sendToPlayer({action: 'play', param: this.url});

    this.player.on('close', (code, signal) => {
      logger.info('player close', {code, signal});

      this.player = null;
    });

    this.player.on('end', () => {
      logger.info('player end');
    });

    this.player.on('pause', () => {
      logger.info('player pause');
    });

    this.player.on('resume', () => {
      logger.info('player resume');
    });

    this.player.on('error', err => {
      logger.error('player error', err);
    });

    this.power();
    await delay(100);
    this.unmute();

    this.paused = false;
  }

  async startPlayQueue() {
    if(this.player) {
      await this.sendToPlayer({action: 'quit'});

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
    logger.info('Stream:playPodcast');

    this.playQueue = [podcast];

    this.startPlayQueue();
  }

  async playPodcastList(episodeList) {
    logger.info('Stream:playPodcastList');

    this.playQueue = _.clone(episodeList);

    this.startPlayQueue();
  }

  async playFile(file) {
    logger.info('Stream:playFile');

    this.playQueue = [{label: path.basename(file), url: file}];

    this.startPlayQueue();
  }

  async playStation(station) {
    logger.info('Stream:playStation');

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

  async pause() {
    logger.info('Stream:pause');

    await this.sendToPlayer({action: 'pause'});
    this.paused = true;
  }

  async resume() {
    logger.info('Stream:resume');

    await this.sendToPlayer({action: 'pause'});
    this.paused = false;
  }

  async next() {
    logger.info('Stream:next');

    if(this.player) {
      await this.sendToPlayer({action: 'quit'});
    }
  }

  async stopStream() {
    this.playQueue = [];

    logger.info('Stream:stopStream');

    if(this.player) {
      await this.sendToPlayer({action: 'quit'});
    }
  }

  async volumeDown() {
    if(!this.player) {
      return;
    }

    logger.info('Stream:volumeDown');

    const down = _.max([_.round(this.volume * 0.1), 1]);

    this.volume = _.max([this.volume - down, 0]);
    await this.sendToPlayer({action: 'volume', param: this.volume});

    this.lastVolumeUse = moment();
  }

  async volumeUp() {
    if(!this.player) {
      return;
    }

    logger.info('Stream:volumeUp');

    const up = _.max([_.round(this.volume * 0.1), 1]);

    this.volume = _.min([this.volume + up, 100]);
    await this.sendToPlayer({action: 'volume', param: this.volume});

    this.lastVolumeUse = moment();
  }
}

module.exports = Stream;
