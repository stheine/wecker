'use strict';

/* eslint-disable no-underscore-dangle */

const _        = require('lodash');
const moment   = require('moment');
const request  = require('request-promise-native');
const xmlJs    = require('xml-js');

const Menu     = require('./Menu');
const menus    = require('./menus');
const podcasts = require('./podcasts');

class Logic {
  constructor({render, stream}) {
    this.render           = render;
    this.stream           = stream;

    this.display          = 'time';
    this.previousDisplay  = null;
    this.timer            = null;

    this.menuStack        = [];
    this.menus            = {};
    const thisMenuEntries = menus(this);

    _.forOwn(thisMenuEntries, (entries, menuKey) => {
      this.menus[menuKey] = new Menu({entries});
    });
    this.activeMenu      = this.menus.top;
  }

  clearTimeout() {
    if(this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  restorePreviousDisplay() {
    if(this.previousDisplay) {
      this.display = this.previousDisplay;
      this.previousDisplay = null;
      this.refresh();
    }
  }

  refresh() {
    if(this.display === 'menu' && !this.activeMenu) {
      this.display = 'time';
    }

    switch(this.display) {
      case 'menu':   this.render.refresh({display: this.display, menu: this.activeMenu}); break;
      case 'time':   this.render.refresh({display: this.display, moment: moment()}); break;
      case 'volume': this.render.refresh({display: this.display, volume: this.stream.volume}); break;

      default: throw new Error(`press1(): unhandled display ${this.display}`);
    }
  }

  async trigger(target, action, option) {
    switch(target) {
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

      case 'stream':
        switch(action) {
          case 'play':
            await this.stream.set(option);
            this.stream.play();
            break;

          case 'toggle':
            this.stream.toggle();
            break;

          case 'podPlay':
            await this.stream.setUrl(option);
            this.stream.play();
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
              _.map(items, item => ({
                label: getLabel(item),
                press: () => {
                  this.trigger('stream', 'podPlay', item.guid._text);
                },
              })))});

            await this.trigger('menu', 'open', 'podcastList');
            break;
          }

          default: throw new Error(`trigger(${target}): unhandled action ${action}`);
        }
        break;

      default: throw new Error(`trigger(): unhandled target ${target}`);
    }

    this.refresh();
  }

  press1() {
    this.clearTimeout();
    this.restorePreviousDisplay();

    switch(this.display) {
      case 'menu':
        this.activeMenu.press();
        break;

      case 'time':
        this.activeMenu = this.menus.top;
        this.display    = 'menu';
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
      case 'menu':   this.activeMenu.next(); break;
      case 'time':   break; // TODO
      case 'volume': break; // TODO

      default: throw new Error(`left1(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  right1() {
    switch(this.display) {
      case 'menu':   this.activeMenu.previous(); break;
      case 'time':   break; // TODO
      case 'volume': break; // TODO

      default: throw new Error(`left1(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  press2() {
    this.clearTimeout();
    this.restorePreviousDisplay();

    switch(this.display) {
      case 'menu':   break; // TODO
      case 'time':   this.display = 'menu'; break;
      case 'volume': this.display = 'time'; break;

      default: throw new Error(`press(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  up2() {
    // button up

    this.refresh();
  }

  left2() {
    if(this.stream.player) {
      if(this.display !== 'volume') {
        this.restorePreviousDisplay();
        this.previousDisplay = this.display;
      }

      this.display = 'volume';
      this.stream.volumeDown.bind(this.stream)();

      this.clearTimeout();

      this.timer = setTimeout(() => {
        this.clearTimeout();
        this.restorePreviousDisplay();
      }, 1000);

      return;
    }

    switch(this.display) {
      case 'menu':   this.activeMenu.next(); break;
      case 'time':   break; // TODO
      case 'volume': break; // TODO

      default: throw new Error(`left(): unhandled display ${this.display}`);
    }

    this.refresh();
  }

  right2() {
    if(this.stream.player) {
      if(this.display !== 'volume') {
        this.restorePreviousDisplay();
        this.previousDisplay = this.display;
      }

      this.display = 'volume';
      this.stream.volumeUp.bind(this.stream)();

      this.clearTimeout();

      this.timer = setTimeout(() => {
        this.clearTimeout();
        this.restorePreviousDisplay();
      }, 1000);

      return;
    }

    switch(this.display) {
      case 'menu':   this.activeMenu.previous(); break;
      case 'time':   break; // TODO
      case 'volume': break; // TODO

      default: throw new Error(`left(): unhandled display ${this.display}`);
    }

    this.refresh();
  }
}

module.exports = Logic;
