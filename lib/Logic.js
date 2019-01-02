'use strict';

/* eslint-disable no-underscore-dangle */

const _      = require('lodash');
const moment = require('moment');

const Menu   = require('./Menu');
const menus  = require('./menus');

const backToTimeDisplayTimeout = 5000;
const volumeTimeout            = 2000;

class Logic {
  constructor({alarm, render, stream}) {
    this.alarm            = alarm;
    this.render           = render;
    this.stream           = stream;

    this.display          = 'time';
    this.previousDisplay  = null;
    this.timers           = {};

    this.menuStack        = [];
    this.menus            = {};
    const thisMenuEntries = menus(this);

    _.forOwn(thisMenuEntries, (entries, menuKey) => {
      this.menus[menuKey] = new Menu({entries});
    });
    this.activeMenu       = this.menus.top;

    this.backToTimeDisplay = this.backToTimeDisplay.bind(this);
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

  restorePreviousDisplay() {
    this.clearTimeout('previous');

    if(this.previousDisplay) {
      this.display = this.previousDisplay;
      this.previousDisplay = null;
      this.refresh();
    }
  }

  backToTimeDisplay() {
    this.clearTimeout('backToTimeDisplay');

    if(this.display !== 'time') {
      this.display   = 'time';
      this.menuStack = [];
      this.refresh();
    }
  }

  getTimeInfo() {
    const info = {};

    if(this.stream.player) {
      info.large = this.stream.label;
    } else {
      info.large = null;
    }

    if(this.alarm.time) {
      info.bottom = this.alarm.time;
    }

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
          info:    this.getTimeInfo(),
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

  condition(target, check) {
    switch(target) {
      case 'alarm':
        switch(check) {
          case 'isSet':
            if(this.alarm.time) {
              return true;
            }

            return false;

          default: throw new Error(`condition(${target}): unhandled check ${check}`);
        }

      case 'stream':
        switch(check) {
          case 'isPlaying':
            if(this.stream.player) {
              return true;
            }

            return false;

          default: throw new Error(`condition(${target}): unhandled check ${check}`);
        }

      default: throw new Error(`condition(): unhandled target ${target}`);
    }
  }

  async trigger(target, action, option) {
    switch(target) {
      case 'alarm':
        switch(action) {
          case 'set':
            this.alarm.set(option);
            break;

          case 'off':
            this.alarm.off();
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
            const podcastListMenuLabel = `podcastList_${option}`;

            if(_.get(this.menus, [podcastListMenuLabel, 'refreshed'], moment('2000-01-01'))
              < moment().subtract(15, 'minutes')
            ) {
              const podcastList = await this.stream.getPodcastList(option);

              this.menus[podcastListMenuLabel] = new Menu({entries: _.concat([
                {
                  label: '<- Zurück',
                  press: () => {
                    this.trigger('menu', 'close');
                  },
                }],
                _.map(podcastList, item => ({
                  label: item.podcastLabel,
                  press: () => {
                    this.trigger('stream', 'playPodcast', {label: item.podcastLabel, url: item.guid._text});
                  },
                })))});
              this.menus[podcastListMenuLabel].refreshed = moment();
            }

            await this.trigger('menu', 'open', podcastListMenuLabel);
            break;
          }

          case 'playFirst': {
            const podcastList = await this.stream.getPodcastList(option);
            const item = _.first(podcastList);

            this.trigger('stream', 'playPodcast', {label: item.podcastLabel, url: item.guid._text});
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

          case 'playStation':
            await this.stream.playStation(option);
            break;

          case 'stop':
            await this.stream.stop();
            break;

          default: throw new Error(`trigger(${target}): unhandled action ${action}`);
        }
        break;

      default: throw new Error(`trigger(): unhandled target ${target}`);
    }

    this.refresh();
  }

  press1() {
    this.restorePreviousDisplay();

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

      case 'volume': break; // TODO

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
        this.activeMenu.next();
        this.setTimeout('backToTimeDisplay', backToTimeDisplayTimeout, this.backToTimeDisplay);
        break;

      case 'time':   break; // TODO
      case 'volume': break; // TODO

      default: throw new Error(`left1(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  right1() {
    switch(this.display) {
      case 'menu':
        this.activeMenu.previous();
        this.setTimeout('backToTimeDisplay', backToTimeDisplayTimeout, this.backToTimeDisplay);
        break;

      case 'time':   break; // TODO
      case 'volume': break; // TODO

      default: throw new Error(`left1(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  press2() {
    this.restorePreviousDisplay();

    if(this.stream.player) {
      if(this.stream.paused) {
        this.stream.resume();

        this.display = 'time';
      } else {
        this.stream.pause();

        this.display = 'paused';
      }
    } else {
      switch(this.display) {
        case 'dim':    this.display = 'time'; break;
        case 'menu':   this.display = 'time'; break;
        case 'paused': this.display = 'time'; break;
        case 'time':   this.display = 'time'; break;
        case 'volume': this.display = 'time'; break;

        default: throw new Error(`press2(): unhandled display ${this.display}`);
      }
    }


    this.refresh();
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

      case 'menu': /* do nothing */ break;

      case 'time':
      case 'volume':
        if(this.stream.player) {
          if(this.display !== 'volume') {
            this.restorePreviousDisplay();
            this.previousDisplay = this.display;
          }

          this.display = 'volume';
          this.setTimeout('previous', volumeTimeout, () => {
            this.restorePreviousDisplay();
          });

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
      case 'time':
      case 'volume':
        if(this.stream.player) {
          if(this.display !== 'volume') {
            this.restorePreviousDisplay();
            this.previousDisplay = this.display;
          }

          this.display = 'volume';
          this.stream.volumeUp.bind(this.stream)();

          this.setTimeout('previous', volumeTimeout, () => {
            this.restorePreviousDisplay();
          });

          return;
        }
        break;

      default: throw new Error(`right2(): unhandled display ${this.display}`);
    }

    this.refresh();
  }
}

module.exports = Logic;
