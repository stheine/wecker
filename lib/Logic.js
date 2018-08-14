'use strict';

/* eslint-disable class-methods-use-this */
/* eslint-disable max-statements-per-line */

class Logic {
  constructor({menu, stream}) {
    this.menu    = menu;
    this.stream  = stream;

    this.display         = 'time';
    this.previousDisplay = null;
    this.timer           = null;
  }

  press1() {
    if(this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    switch(this.display) {
      case 'menu':   this.menu.press.bind(this.menu)(); break;
      case 'time':   this.display = 'menu'; break;
      case 'volume': break; // TODO

      default: throw new Error(`press1(): unhandled display ${this.display}`);
    }
  }

  up1() {
    // button up
  }

  left1() {
    switch(this.display) {
      case 'menu':   this.menu.next.bind(this.menu)(); break;
      case 'time':   break; // TODO
      case 'volume': break; // TODO

      default: throw new Error(`left1(): unhandled display ${this.display}`);
    }
  }

  right1() {
    switch(this.display) {
      case 'menu':   this.menu.previous.bind(this.menu)(); break;
      case 'time':   break; // TODO
      case 'volume': break; // TODO

      default: throw new Error(`left1(): unhandled display ${this.display}`);
    }
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
  }

  up2() {
    // button up
  }

  left2() {
    if(this.stream.playing) {
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
      }, 1000);

      return;
    }

    switch(this.display) {
      case 'menu':   this.menu.next.bind(this.menu)(); break;
      case 'time':   break; // TODO
      case 'volume': break; // TODO

      default: throw new Error(`left(): unhandled display ${this.display}`);
    }
  }

  right2() {
    if(this.stream.playing) {
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
      }, 1000);

      return;
    }

    switch(this.display) {
      case 'menu':   this.menu.previous.bind(this.menu)(); break;
      case 'time':   break; // TODO
      case 'volume': break; // TODO

      default: throw new Error(`left(): unhandled display ${this.display}`);
    }
  }
}

module.exports = Logic;
