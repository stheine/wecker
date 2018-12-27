'use strict';

/* eslint-disable no-underscore-dangle */

const _        = require('lodash');
const moment   = require('moment');
const request  = require('request-promise-native');
const xmlJs    = require('xml-js');

const Menu     = require('./Menu');
const menus    = require('./menus');
const podcasts = require('./podcasts');

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

  refresh() {
    if(this.display === 'menu' && !this.activeMenu) {
      this.display = 'time';
    }

    switch(this.display) {
      case 'dim':
        this.render.refresh({
          display: this.display,
          dim:     this.render.dim,
        });
        break;

      case 'menu':
        this.render.refresh({
          display: this.display,
          menu:    this.activeMenu,
        });
        break;

      case 'time':
        this.render.refresh({
          display: this.display,
          moment:  moment(),
          info:    this.getTimeInfo(),
        });
        break;

      case 'volume':
        this.render.refresh({
          display: this.display,
          volume:  this.stream.volume
        });
        break;

      default: throw new Error(`press1(): unhandled display ${this.display}`);
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
            this.alarm.set('14:00'); // TODO
            break;

          case 'off':
            this.alarm.off();
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
            if(!podcasts[option]) {
              throw new Error(`Unhandled station ${option}`);
            }

            const xml = await request.get(podcasts[option]);
            const rss = xmlJs.xml2js(xml, {compact: true});
            const items = _.slice(rss.rss.channel.item, 0, 10);
            let   getLabel = item => item.title._text;

            if(getLabel(items[0]) === getLabel(items[1])) {
              getLabel = item => item.pubDate._text
                .replace(/^\w+, \d+ \w+ \d+ /, '')
                .replace(/:\d+ \+\d+$/, '');
            }

            this.menus.podcastList = new Menu({entries: _.concat([
              {
                label: '<- Zurück',
                press: () => {
                  this.trigger('menu', 'close');
                },
              }],
              _.map(items, item => {
                const label = getLabel(item);

                return {
                  label,
                  press: () => {
                    this.trigger('stream', 'playPodcast', {label, url: item.guid._text});
                  },
                };
              }))});

            await this.trigger('menu', 'open', 'podcastList');
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

    switch(this.display) {
      case 'dim':    this.display = 'time'; break;
      case 'menu':   this.display = 'time'; break;
      case 'time':   this.display = 'menu'; break;
      case 'volume': this.display = 'time'; break;

      default: throw new Error(`press2(): unhandled display ${this.display}`);
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
        this.render.dim -= 10;
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
        this.render.dim += 10;
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
