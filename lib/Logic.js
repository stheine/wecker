'use strict';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */

const _           = require('lodash');
const cron        = require('cron');
const dayjs       = require('dayjs');
const millisecond = require('millisecond');
const localeData  = require('dayjs/plugin/localeData');
                    require('dayjs/locale/de');

const Menu        = require('./Menu');
const menus       = require('./menus');

dayjs.extend(localeData);
dayjs.locale('de');

const backToTimeDisplayTimeout = millisecond('5 seconds');
const volumeTimeout            = millisecond('2 seconds');

class Logic {
  constructor({alarm, logger, render, stream}) {
    this.alarm            = alarm;
    this.logger           = logger;
    this.render           = render;
    this.stream           = stream;

    this.display          = 'time';
    this.warnings         = {};
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

  terminate() {
    if(this.jobDimOff) {
      this.jobDimOff.stop();
      this.jobDimOff = undefined;
    }
    if(this.jobDimOn) {
      this.jobDimOn.stop();
      this.jobDimOn = undefined;
    }
  }

  warn({name, value}) {
    if(value) {
      this.warnings[name] = value;
    } else {
      Reflect.deleteProperty(this.warnings, name);
    }

    if(!_.isEmpty(this.warnings)) {
      this.logger.warn('warn', this.warnings);
    }
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
    if(!alarms) {
      return;
    }

    const currentTime    = dayjs();
    const displayEndTime = dayjs().add(20, 'hours');
    let   checkDayNum    = dayjs().day();
    let   checkedDays    = 0;

    do {
      const checkDayName = dayjs.weekdays()[checkDayNum];
      const checkAlarm   = _.get(alarms, [checkDayName]);

      if(checkAlarm) {
        const checkDate = dayjs().add(checkedDays, 'days').format('YYYY-MM-DD');
        const nextAlarm  = dayjs(`${checkDate} ${checkAlarm}`, 'YYYY-MM-DD HH:mm');
        // console.log('checkAlarm', {checkDayName, checkAlarm, checkDate, nextAlarm, currentTime, displayEndTime});

        if(nextAlarm.isAfter(currentTime) &&
          nextAlarm.isBefore(displayEndTime)
        ) {
          const displayNextAlarm = `${checkDayName.slice(0, 3)} ${checkAlarm}`;

          // console.log('findNextAlarm found', displayNextAlarm);

          return displayNextAlarm;
        }
      }

      checkDayNum++;
      checkedDays++;

      if(checkDayNum > 6) {
        checkDayNum = 0;
      }
    } while(checkedDays < 2);
  }

  getTimeDisplayInfo() {
    const info = {};

    if(_.isEmpty(this.warnings)) {
      if(this.stream.playing) {
        info.large = this.stream.label;
      } else {
        info.large = null;
      }

      info.bottom = this.findNextAlarm(this.alarm.alarms);
    } else {
      info.large = _.map(this.warnings, (value, name) => `${name}: ${value}`).join('   ');
    }

    // this.logger.info('info', info);

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
          alarms:  this.alarm.alarms,
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
          dayjs:   dayjs(),
          info:    this.getTimeDisplayInfo(),
        });
        break;

      case 'volume':
        await this.render.refresh({
          display: this.display,
          volume:  this.stream.volume,
        });
        break;

      case 'alarm':
      case 'exit':
      case 'podcast':
      case 'set':
      case 'stream':
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
            if(this.stream.playing) {
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

      case 'exit':
        this.logger.info('Exit');	    
        process.exit(0);
        break;

      case 'menu':
        switch(action) {
          case 'backToTimeMenu':
            this.backToTimeDisplay();
            break;

          case 'close':
            this.activeMenu = this.menuStack.pop();
            break;

          case 'open':
            this.menuStack.push(this.activeMenu);
            this.activeMenu = this.menus[option];
            break;

          case 'openAndExecute':
            this.menuStack.push(this.activeMenu);
            this.activeMenu = this.menus[option.open];

            option.execute();
            break;

          case 'setActive':
            this.activeMenu.setActiveEntry(option);
            break;

          default: throw new Error(`trigger(${target}): unhandled action ${action}`);
        }
        break;

      case 'podcast':
        switch(action) {
          case 'list': {
            const podcastListMenuLabel = `podcastList_${option.label}`;

            if(_.get(this.menus, [podcastListMenuLabel, 'refreshed'], dayjs().subtract(1, 'hour')) <
              dayjs().subtract(15, 'minutes')
            ) {
              let episodeList = await this.stream.getEpisodeList(option);

              episodeList = _.filter(episodeList, episode =>
                dayjs(episode.pubDate._text).isAfter(dayjs().subtract(option.maxAge)) &&
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
              this.menus[podcastListMenuLabel].refreshed = dayjs();
            }

            await this.trigger('menu', 'open', podcastListMenuLabel);
            break;
          }

          case 'playFirst': {
            const episodeList = await this.stream.getEpisodeList(option);

            if(episodeList.length) {
              const episode     = _.first(episodeList);

              this.trigger('stream', 'playPodcast', this.getEpisodeData(episode));
            }
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

      case 'alarm':
      case 'exit':
      case 'paused':
      case 'podcast':
      case 'set':
      case 'stream':
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
      case 'dim':
        break;

      case 'menu':
        this.activeMenu.previous();
        this.setTimeout('backToTimeDisplay', backToTimeDisplayTimeout, this.backToTimeDisplay);
        break;

      case 'time':
      case 'volume':
        this.backToTimeDisplay();
        break;

      case 'alarm':
      case 'exit':
      case 'paused':
      case 'podcast':
      case 'set':
      case 'stream':
        break;

      default: throw new Error(`left1(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  right1() {
    switch(this.display) {
      case 'dim':
        break;

      case 'menu':
        this.activeMenu.next();
        this.setTimeout('backToTimeDisplay', backToTimeDisplayTimeout, this.backToTimeDisplay);
        break;

      case 'time':
      case 'volume':
        this.backToTimeDisplay();
        break;

      case 'alarm':
      case 'exit':
      case 'paused':
      case 'podcast':
      case 'set':
      case 'stream':
        break;

      default: throw new Error(`left1(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  press2() {
    if(this.stream.playing) {
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
        if(this.stream.playing) {
          this.display = 'volume';
          this.setTimeout('backToTimeDisplay', volumeTimeout, this.backToTimeDisplay);

          this.stream.volumeDown.bind(this.stream)();

          return;
        }
        break;

      case 'alarm':
      case 'exit':
      case 'paused':
      case 'podcast':
      case 'set':
      case 'stream':
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
        if(this.stream.playing) {
          this.display = 'volume';
          this.setTimeout('backToTimeDisplay', volumeTimeout, this.backToTimeDisplay);

          this.stream.volumeUp.bind(this.stream)();

          return;
        }
        break;

      case 'alarm':
      case 'exit':
      case 'paused':
      case 'podcast':
      case 'set':
      case 'stream':
        break;

      default: throw new Error(`right2(): unhandled display ${this.display}`);
    }

    this.refresh();
  }
}

module.exports = Logic;
