/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
/* eslint-disable unicorn/consistent-function-scoping */

import {setTimeout as delay} from 'node:timers/promises';
import path                  from 'node:path';

import _                     from 'lodash';
import dayjs                 from 'dayjs';
import {execa}               from 'execa';
import mpg123                from '@stheine/mpg123';
import xmlJs                 from 'xml-js';

import logger                from './logger.js';
import stations              from './stations.js';

const MUTE     = 36; // Miniamp, GPIO 16, PIN 36
const SHUTDOWN = 37; // Miniamp, GPIO 26, PIN 37

// const initialAlsaVolume   = 150;
const initialMpg123Volume = 0.5;
const maxMpg123Volume = 5;

class Stream {
  constructor({rpio}) {
    this.rpio = rpio;

    (async() => {
      this.rpio.open(MUTE, rpio.OUTPUT, rpio.HIGH); // unmute
      await delay(200);
      this.rpio.open(SHUTDOWN, rpio.OUTPUT, rpio.HIGH); // power
    })();

    this.label         = null;
    this.player        = null;
    this.playing       = false;
    this.paused        = null;
    this.url           = null;
    this.volume        = initialMpg123Volume;
    this.lastVolumeUse = dayjs();
    this.playQueue     = [];

    // execa('amixer', ['set', 'Master', initialAlsaVolume]);
  }

  async sendToPlayer(data) {
    const {action, param} = data;
    const command         = `${action}${param ? ` ${param}` : ''}`;

    if(!this.player) {
      logger.warn(`player not running for ${action}`);

      return;
    }

    logger.info('sendToPlayer', command);

    if(!_.isFunction(this.player[action])) {
      logger.warn(`mpg123 player.${action} is not a function`);

      return;
    }

    try {
      this.player[action](param);
    } catch(err) {
      logger.error('Unexpected error in mpg123 player', err.message);

      this.player  = null;
      this.playing = false;
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
    logger.info('Stream:getEpisodeList', podcast.url);

    // Note, getting the episode list via `await request.get(podcast.url)` would
    // be cheaper, but does not work within the cron-schedule alarm handler.
    // Reason? Unknown!
    let getLabel;
    let items;
    let rss;
    let stdout;

    try {
      ({stdout} = await execa('curl', [podcast.url]));
      // logger.info('Stream:getEpisodeList stdout', stdout);
    } catch(err) {
      logger.error(`Failed to get podcast: ${err.message}`);

      return [];
    }
    try {
      rss = xmlJs.xml2js(stdout, {compact: true});
      // logger.info('Stream:getEpisodeList xml', rss);
    } catch(err) {
      logger.error(`Failed to parse podcast: ${err.message}`, stdout);

      return [];
    }
    try {
      items = _.slice(rss.rss.channel.item, 0, 10);
      // logger.info('Stream:getEpisodeList items', items);
      logger.info(`Stream:getEpisodeList ${items.length} items`);
    } catch(err) {
      logger.error(`Failed to get items: ${err.message}`, rss);

      return [];
    }

    switch(podcast.label) {
      case 'Nachrichten':
//      logger.info('Stream:getEpisodeList Nachrichten');
        getLabel = item => item.pubDate._text
          .replace(/^\w+, \d+ \w+ \d+ /, '')
          .replace(/:\d+ \+\d+$/, '');
        break;

      case 'Abend':
        getLabel = item => item.title._text
          .replace(/^Informationen am Abend, /, '')
          .replace(/, komplette Sendung$/, '');
        break;

      default:
//      logger.info('Stream:getEpisodeList other');
        getLabel = item => item.title._text;
        break;
    }

//    logger.info('Stream:getEpisodeList getLabels');
    const episodeList = _.map(items, item => _.assign(item, {
      episodeLabel: getLabel(item),
    }));

//    logger.info('Stream:getEpisodeList done', episodeList);
//    logger.info('Stream:getEpisodeList done');

    return episodeList;
  }

  async startPlayer() {
    if(this.player) {
      return;
    }

    this.player = new mpg123.MpgPlayer(null, true);

    this.player.on('close', async(code, signal) => {
      logger.info('player close', {code, signal});

      this.player  = null;
      this.playing = true;

      await this.stopAudio();
    });

    this.player.on('end', async() => {
      logger.info('player end');

      await this.next();
    });

    this.player.on('pause', () => {
      logger.info('player pause');
    });

    this.player.on('resume', () => {
      logger.info('player resume');
    });

    this.player.on('error', err => {
      logger.error('player error', err);

      this.player  = null;
      this.playing = false;
    });
  }

  async stopAudio() {
//    this.mute();
//    await delay(100);
//    this.shutdown();
  }

  async play({label, url}) {
    await this.startPlayer();

    const volume = this.getInitialVolume();

    await this.sendToPlayer({action: 'volume', param: volume});

//    this.mute();
//    await delay(100);
//    this.power();
//    await delay(500);
//    this.unmute();

    this.label  = label;
    this.url    = url.replace(/^https/, 'http');

    logger.info('Stream:play');

    await this.sendToPlayer({action: 'play', param: this.url});

    this.playing = true;
    this.paused = false;
  }

  async next() {
    if(this.playing) {
      logger.info('Stream:next / stop');

      this.playing = false;

      await this.sendToPlayer({action: 'stop'});
      // This will trigger the 'end' event and come into next() again, with playing = false.
    } else if(this.playQueue.length) {
      logger.info('Stream:next / play');

      const queueItem = this.playQueue.shift();

      await this.play(queueItem);
    } else {
      logger.info('Stream:next / queue empty');

      this.label         = null;
      this.paused        = null;
      this.url           = null;
      this.lastVolumeUse = dayjs();
    }
  }

  async playPodcast(podcast) {
    logger.info('Stream:playPodcast');

    this.playQueue = [podcast];

    await this.next();
  }

  async playPodcastList(episodeList) {
    logger.info('Stream:playPodcastList');

    this.playQueue = _.clone(episodeList);

    await this.next();
  }

  async playFile(file) {
    logger.info('Stream:playFile');

    this.playQueue = [{label: path.basename(file), url: file}];

    await this.next();
  }

  async playStation(station) {
    logger.info('Stream:playStation');

    if(!stations[station]) {
      throw new Error(`Unhandled station ${station}`);
    }

    this.playQueue = [{label: station, url: stations[station]}];

    await this.next();
  }

  getInitialVolume() {
    const expire = dayjs().subtract(30, 'minutes');

    if(this.lastVolumeUse.isBefore(expire)) {
      this.volume = initialMpg123Volume;

      this.lastVolumeUse = dayjs();
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

  async stopStream() {
    logger.info('Stream:stopStream');

    await this.sendToPlayer({action: 'stop'});
    this.playQueue = [];
    this.playing   = false;

    await this.stopAudio();
  }

  async volumeDown() {
    logger.info('Stream:volumeDown');

    const down = _.max([_.round(this.volume * 0.1), 0.1]);

    this.volume = _.max([this.volume - down, 0]);
    await this.sendToPlayer({action: 'volume', param: this.volume});

    this.lastVolumeUse = dayjs();
  }

  async volumeUp() {
    logger.info('Stream:volumeUp');

    const up = _.max([_.round(this.volume * 0.1), 0.1]);

    this.volume = _.min([this.volume + up, maxMpg123Volume]);
    await this.sendToPlayer({action: 'volume', param: this.volume});

    this.lastVolumeUse = dayjs();
  }
}

export default Stream;
