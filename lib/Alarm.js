'use strict';

/* eslint-disable no-underscore-dangle */

const path = require('path');

const _    = require('lodash');
const cron = require('node-cron');

class Alarm {
  constructor({data, stream}) {
    this.data   = data;
    this.stream = stream;

    this.task = null;
    this.set(data.data.alarm);

    this.wakePodcast = this.wakePodcast.bind(this);
  }

  timeToCron(time) {
    const [hour, minute] = time.split(/:/);

    //      ┌────────────── second (optional)
    //      │ ┌──────────── minute
    //      │ │ ┌────────── hour
    //      │ │ │ ┌──────── day of month
    //      │ │ │ │ ┌────── month
    //      │ │ │ │ │ ┌──── day of week
    //      │ │ │ │ │ │
    //      │ │ │ │ │ │
    //      * * * * * *
    return `0 ${minute} ${hour} * * *`;
//    return `*/5 * * * * *`;
  }

  async wakePodcast() {
    const podcastList = await this.stream.getPodcastList('Nachrichten');
    const item = _.first(podcastList);

    await this.stream.playPodcast({label: item.podcastLabel, url: item.guid._text});
  }

  async wakeAlarm() {
//    await this.stream.playFile(path.join('sounds', 'alarmClock.mp3'));
    await this.stream.playFile(path.join('sounds', 'pager.mp3'));
  }

  off() {
    this.data.set({alarm: null});
    this.time = null;

    if(this.task) {
      this.task.destroy();
      this.task = null;
    }
  }

  set(time) {
    if(!time) {
      this.off();

      return;
    }

    this.data.set({alarm: time});
    this.time = time;

    this.task = cron.schedule(this.timeToCron(time), async() => {
      await this.wakePodcast();
    });
  }
}

module.exports = Alarm;
