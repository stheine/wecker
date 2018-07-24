'use strict';

/* eslint-disable class-methods-use-this */

const moment  = require('moment');

// const font7   = require('oled-font-5x7');
// const font16  = require('../fonts/oled-js-font-Consolas-16');
const font12  = require('../fonts/oled-js-font-Consolas-12');
const font16  = require('../fonts/oled-js-font-DejaVuSansMono-16');
const font46  = require('../fonts/oled-js-font-Consolas-46');

const font    = font12;
const height  = font.height;
const padding = 4;

class Render {
  constructor({menu, oled}) {
    this.menu     = menu;
    this.oled     = oled;

    this.lastTime = '';
  }

  async select() {
    this.menu.display(); // TODO brauche ich das ueberhaupt?
    let y = 0;

    this.oled.clearDisplay(false);

    for(let key = 0; key < this.menu.entries.length; key++) {
      const entry = this.menu.entries[key];

      if(key === this.menu.activeEntry) {
        this.oled.fillRect(0, y, 127, height, 'WHITE', false);
        this.oled.setCursor(padding, y);
        this.oled.writeString(font, 1, entry.label, 'BLACK', false, 10, false);
  //      this.oled.drawLine(0, y, 127, y, 'BLACK', false);
  //      this.oled.fillRect(0, y, 127, 1, 'BLACK', false);
      } else {
  //      this.oled.drawRect(0, y, 127, height, 'WHITE', false);
        this.oled.setCursor(padding, y + 2);
        this.oled.writeString(font, 1, entry.label, 'WHITE', false, 10, false);
      }

      y += height;
    }

    await this.oled.update();
  }

  async time() {
    const currentMoment = moment();
    const currentTime   = currentMoment.format('HH:mm:ss');

    if(currentTime !== this.lastTime) {
      this.lastTime = currentTime;

      this.oled.clearDisplay(false);
      this.oled.setCursor(0,  -10);
      this.oled.writeString(font46, 1, currentMoment.format('HH'), 'WHITE', true, 0, false);
      this.oled.setCursor(50, -10);
      this.oled.writeString(font46, 1, ':', 'WHITE', true, 0, false);
      this.oled.setCursor(72, -10);
      this.oled.writeString(font46, 1, currentMoment.format('mm'), 'WHITE', true, 0, false);
      this.oled.setCursor(92, 35);
      this.oled.writeString(font16, 1, currentMoment.format(':ss'), 'WHITE', true, 0, false);

      await this.oled.update();
    }
  }

  async refresh() {
    if(this.menu.isActive) {
      this.select();
    } else {
      this.time();
    }
  }

  press() {
    if(this.menu.isActive) {
      if(typeof this.menu.entries[this.menu.activeEntry].press === 'function') {
        this.menu.entries[this.menu.activeEntry].press();
      }
    } else {
      this.menu.isActive = true;
    }
  }

  up() {
    // button up
  }

  left() {
    if(this.menu.isActive) {
      this.menu.previous();
    } else {
      // TODO
    }
  }

  right() {
    if(this.menu.isActive) {
      this.menu.next();
    } else {
      // TODO
    }
  }
}

module.exports = Render;
