'use strict';

/* eslint-disable no-underscore-dangle */

const _           = require('lodash');
const cron        = require('cron');
const millisecond = require('millisecond');
const moment      = require('moment');

const Menu        = require('./Menu');
const menus       = require('./menus');

const backToTimeDisplayTimeout = millisecond('5 seconds');
const volumeTimeout            = millisecond('2 seconds');

class Logic {
  constructor({alarm, render, stream}) {
    this.alarm            = alarm;
    this.render           = render;
    this.stream           = stream;

    this.display          = 'time';
    this.timers           = {};

    this.menuStack        = [];
    this.menus            = {};
    const thisMenuEntries = menus(this);

    _.forOwn(thisMenuEntries, (entries, menuKey) => {
      this.menus[menuKey] = new Menu({entries});
    });
    this.activeMenu       = this.menus.top;

    this.backToTimeDisplay = this.backToTimeDisplay.bind(this);

    this.jobDimOff = new cron.CronJob({
      cronTime: '0 30 7 * * *',
      onTick:   () => {
        this.render.dim = 255;
      },
      start:    true,
    });
    this.jobDimOn = new cron.CronJob({
      cronTime: '0 30 22 * * *',
      onTick:   () => {
        this.render.dim = 0;
      },
      start:    true,
    });
  }

  clearTimeout(label) {
    if(this.timers[label]) {
      clearTimeout(this.timers[label]);
      Reflect.deleteProperty(this.timers, label);
    }
  }

  setTimeout(label, timeout, call) {
    this.clearTimeout(label);

    this.timers[label] = setTimeout(call, timeout);
  }

  backToTimeDisplay() {
    this.clearTimeout('backToTimeDisplay');

    if(this.display !== 'time') {
      this.display   = 'time';
      this.menuStack = [];
      this.refresh();
    }
  }

  findNextAlarm(alarms) {
    const currentTime    = moment();
    const displayEndTime = moment().add(20, 'hours');
    let   checkDayNum    = moment().day();
    let   checkedDays    = 0;

    do {
      const dayName      = moment.weekdays()[checkDayNum];
      const dayNameLocal = moment.localeData('de').weekdays()[checkDayNum];
      const dayAlarm     = _.get(alarms, [dayNameLocal]);

      if(dayAlarm &&
        moment(`${dayName} ${dayAlarm}`, 'dddd h:mm').isAfter(currentTime) &&
        moment(`${dayName} ${dayAlarm}`, 'dddd h:mm').isBefore(displayEndTime)
      ) {
        return `${dayNameLocal} ${dayAlarm}`;
      }

      checkDayNum++;
      checkedDays++;

      if(checkDayNum > 6) {
        checkDayNum = 0;
      }
    } while(checkedDays !== 2);
  }

  getTimeDisplayInfo() {
    const info = {};

    if(this.stream.player) {
      info.large = this.stream.label;
    } else {
      info.large = null;
    }

    info.bottom = this.alarm.alarms ? this.findNextAlarm(this.alarm.alarms) : null;

    return info;
  }

  async refresh() {
    if(this.display === 'menu' && !this.activeMenu) {
      this.display = 'time';
    }

    switch(this.display) {
      case 'dim':
        await this.render.refresh({
          display: this.display,
          dim:     this.render.dim,
        });
        break;

      case 'menu':
        await this.render.refresh({
          display: this.display,
          menu:    this.activeMenu,
        });
        break;

      case 'paused':
        await this.render.refresh({
          display: this.display,
        });
        break;

      case 'time':
        await this.render.refresh({
          display: this.display,
          moment:  moment(),
          info:    this.getTimeDisplayInfo(),
        });
        break;

      case 'volume':
        await this.render.refresh({
          display: this.display,
          volume:  this.stream.volume
        });
        break;

      default: throw new Error(`refresh(): unhandled display ${this.display}`);
    }
  }

  condition(target, test, option) {
    switch(target) {
      case 'alarm':
        switch(test) {
          case 'isSet':
            if(_.get(this.alarm, ['alarms', option])) {
              return true;
            }

            return false;

          default: throw new Error(`condition(${target}): unhandled test ${test}`);
        }

      case 'stream':
        switch(test) {
          case 'isPlaying':
            if(this.stream.player) {
              return true;
            }

            return false;

          case 'hasQueue':
            if(this.stream.playQueue.length) {
              return true;
            }

            return false;

          default: throw new Error(`condition(${target}): unhandled test ${test}`);
        }

      default: throw new Error(`condition(): unhandled target ${target}`);
    }
  }

  getEpisodeData(episode) {
    const label = episode.episodeLabel;
    const url   = episode.guid._text;

    return {label, url};
  }

  async trigger(target, action, option) {
    switch(target) {
      case 'alarm':
        switch(action) {
          case 'set':
            await this.alarm.set(option);
            break;

          case 'off':
            await this.alarm.off({day: option});
            break;

          case 'wake':
            this.alarm.wake();
            break;

          default: throw new Error(`trigger(${target}): unhandled action ${action}`);
        }
        break;

      case 'menu':
        switch(action) {
          case 'close': this.activeMenu = this.menuStack.pop(); break;

          case 'open':
            this.menuStack.push(this.activeMenu);
            this.activeMenu = this.menus[option];
            break;

          default: throw new Error(`trigger(${target}): unhandled action ${action}`);
        }
        break;

      case 'podcast':
        switch(action) {
          case 'list': {
            const podcastListMenuLabel = `podcastList_${option.label}`;

            if(_.get(this.menus, [podcastListMenuLabel, 'refreshed'], moment().subtract(1, 'hour'))
              < moment().subtract(15, 'minutes')
            ) {
              let episodeList = await this.stream.getEpisodeList(option);

              episodeList = _.filter(episodeList, episode =>
                moment(episode.pubDate._text).isAfter(moment().subtract(option.maxAge)) &&
                (!option.exclude ||
                !option.exclude.test(episode.episodeLabel)));

              this.menus[podcastListMenuLabel] = new Menu({entries: _.concat([
                {
                  label: '<- Zurück',
                  press: () => {
                    this.trigger('menu', 'close');
                  },
                }],
                episodeList.length ?
                  {
                    label: 'Alle',
                    press: () => {
                      this.trigger('stream', 'playPodcastList', _.map(episodeList, this.getEpisodeData));
                    },
                  } :
                  [],
                _.map(episodeList, episode => ({
                  label: episode.episodeLabel,
                  press: () => {
                    this.trigger('stream', 'playPodcast', this.getEpisodeData(episode));
                  },
                })))});
              this.menus[podcastListMenuLabel].refreshed = moment();
            }

            await this.trigger('menu', 'open', podcastListMenuLabel);
            break;
          }

          case 'playFirst': {
            const episodeList = await this.stream.getEpisodeList(option);
            const episode     = _.first(episodeList);

            this.trigger('stream', 'playPodcast', this.getEpisodeData(episode));
            break;
          }

          default: throw new Error(`trigger(${target}): unhandled action ${action}`);
        }
        break;

      case 'set':
        switch(action) {
          case 'dim':
            this.display = 'dim';
            break;

          default: throw new Error(`trigger(${target}): unhandled action ${action}`);
        }
        break;

      case 'stream':
        switch(action) {
          case 'playPodcast':
            await this.stream.playPodcast(option);
            break;

          case 'playPodcastList':
            await this.stream.playPodcastList(option);
            break;

          case 'playStation':
            await this.stream.playStation(option);
            break;

          case 'stop':
            await this.stream.stopStream();
            break;

          case 'next':
            await this.stream.next();
            break;

          default: throw new Error(`trigger(${target}): unhandled action ${action}`);
        }
        break;

      default: throw new Error(`trigger(): unhandled target ${target}`);
    }

    this.refresh();
  }

  press1() {
    switch(this.display) {
      case 'menu':
        this.activeMenu.press();
        this.setTimeout('backToTimeDisplay', backToTimeDisplayTimeout, this.backToTimeDisplay);
        break;

      case 'time':
        this.activeMenu = this.menus.top;
        this.display    = 'menu';
        this.setTimeout('backToTimeDisplay', backToTimeDisplayTimeout, this.backToTimeDisplay);
        break;

      case 'dim':
      case 'volume':
        this.backToTimeDisplay();
        break;

      default: throw new Error(`press1(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  up1() {
    // button up

    this.refresh();
  }

  left1() {
    switch(this.display) {
      case 'menu':
        this.activeMenu.previous();
        this.setTimeout('backToTimeDisplay', backToTimeDisplayTimeout, this.backToTimeDisplay);
        break;

      case 'time':
      case 'volume':
        this.backToTimeDisplay();
        break;

      default: throw new Error(`left1(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  right1() {
    switch(this.display) {
      case 'menu':
        this.activeMenu.next();
        this.setTimeout('backToTimeDisplay', backToTimeDisplayTimeout, this.backToTimeDisplay);
        break;

      case 'time':
      case 'volume':
        this.backToTimeDisplay();
        break;

      default: throw new Error(`left1(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  press2() {
    if(this.stream.player) {
      if(this.stream.paused) {
        this.stream.resume();

        this.display = 'time';
      } else {
        this.stream.pause();

        this.display = 'paused';
      }

      this.refresh();
    } else {
      this.backToTimeDisplay();
    }
  }

  up2() {
    // button up

    this.refresh();
  }

  left2() {
    switch(this.display) {
      case 'dim':
        this.render.dim -= _.min([10, this.render.dim]);
        this.setTimeout('backToTimeDisplay', backToTimeDisplayTimeout, this.backToTimeDisplay);
        break;

      case 'menu':
        this.backToTimeDisplay();
        break;

      case 'time':
      case 'volume':
        if(this.stream.player) {
          this.display = 'volume';
          this.setTimeout('backToTimeDisplay', volumeTimeout, this.backToTimeDisplay);

          this.stream.volumeDown.bind(this.stream)();

          return;
        }
        break;

      default: throw new Error(`left2(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  right2() {
    switch(this.display) {
      case 'dim':
        this.render.dim += _.min([10, 255 - this.render.dim]);
        this.setTimeout('backToTimeDisplay', backToTimeDisplayTimeout, this.backToTimeDisplay);
        break;

      case 'menu':
        this.backToTimeDisplay();
        break;

      case 'time':
      case 'volume':
        if(this.stream.player) {
          this.display = 'volume';
          this.setTimeout('backToTimeDisplay', volumeTimeout, this.backToTimeDisplay);

          this.stream.volumeUp.bind(this.stream)();

          return;
        }
        break;

      default: throw new Error(`right2(): unhandled display ${this.display}`);
    }

    this.refresh();
  }
}

module.exports = Logic;
