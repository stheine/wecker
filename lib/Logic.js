'use strict';

const _      = require('lodash');
const moment = require('moment');

const Menu   = require('./Menu');

const menus  = require('./menus');

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

  trigger(target, action, option) {
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
          case 'set':
            this.stream.set(option);
            this.stream.play();
            break;

          case 'toggle':
            this.stream.toggle();
            break;

          default: throw new Error(`trigger(${target}): unhandled action ${action}`);
        }
        break;

      default: throw new Error(`trigger(): unhandled target ${target}`);
    }

    this.refresh();
  }

  press1() {
    if(this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

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
    if(this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

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
        this.previousDisplay = this.display;
      }

      this.display = 'volume';
      this.stream.volumeDown.bind(this.stream)();

      if(this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }

      this.timer = setTimeout(() => {
        this.timer = null;

        this.display = this.previousDisplay;

        this.refresh();
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
        this.previousDisplay = this.display;
      }

      this.display = 'volume';
      this.stream.volumeUp.bind(this.stream)();

      if(this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }

      this.timer = setTimeout(() => {
        this.timer = null;

        this.display = this.previousDisplay;

        this.refresh();
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
