'use strict';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */

const path     = require('path');

const _        = require('lodash');
const cron     = require('cron');

const podcasts = require('./podcasts');

class Alarm {
  constructor({data, stream}) {
    this.alarms = {};
    this.data   = data;
    this.stream = stream;
    this.tasks  = {};

    _.forOwn(data.data.alarms, (time, day) => this.startTask({day, time}));
    this.alarms = data.data.alarms;

    this.wakePodcast = this.wakePodcast.bind(this);
  }

  timeToCron({day, time}) {
    let dayNum;

    switch(day) {
      case 'Montag':     dayNum = 1; break;
      case 'Dienstag':   dayNum = 2; break;
      case 'Mittwoch':   dayNum = 3; break;
      case 'Donnerstag': dayNum = 4; break;
      case 'Freitag':    dayNum = 5; break;
      case 'Samstag':    dayNum = 6; break;
      case 'Sonntag':    dayNum = 7; break;

      default: throw new Error(`Unhandled day ${day}`);
    }

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
    return `0 ${minute} ${hour} * * ${dayNum}`;
  }

  async wakePodcast() {
    if(this.stream.player) {
      return;
    }

    const episodeList = await this.stream.getEpisodeList(_.find(podcasts, {label: 'Nachrichten'}));
    const episode     = _.first(episodeList);

    await this.stream.playPodcast({label: episode.episodeLabel, url: episode.guid._text});
  }

  async wakeAlarm() {
    if(this.stream.player) {
      return;
    }

//    await this.stream.playFile(path.join('sounds', 'alarmClock.mp3'));
    await this.stream.playFile(path.join('sounds', 'pager.mp3'));
  }

  startTask({day, time}) {
    const cronTime = this.timeToCron({day, time});

    if(this.tasks[day]) {
      this.tasks[day].setTime(new cron.CronTime(cronTime));
      this.tasks[day].start();
    } else {
      this.tasks[day] = new cron.CronJob({
        cronTime,
        onTick:   async() => {
          await this.wakePodcast();
        },
        start:    true,
      });
    }
  }

  stopTask({day}) {
    if(this.tasks[day]) {
      this.tasks[day].stop();
    }
  }

  async off({day}) {
    this.stopTask({day});

    Reflect.deleteProperty(this.alarms, day);

    await this.data.set({alarms: this.alarms});
  }

  async set({day, time}) {
    this.stopTask({day});

    if(time) {
      this.startTask({day, time});
      this.alarms[day] = time;
    } else {
      Reflect.deleteProperty(this.alarms, day);
    }

    await this.data.set({alarms: this.alarms});
  }
}

module.exports = Alarm;
