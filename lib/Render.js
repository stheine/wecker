'use strict';

/* eslint-disable class-methods-use-this */
/* eslint-disable max-statements-per-line */
/* eslint-disable max-len */

const moment  = require('moment');

// const font7   = require('oled-font-5x7');
const font12  = require('../fonts/oled-js-font-Consolas-12');
const font16  = require('../fonts/oled-js-font-Consolas-16');
const font20  = require('../fonts/oled-js-font-Consolas-20');
const font46  = require('../fonts/oled-js-font-Consolas-46');

const font    = font12;
const height  = font.height;
const padding = 4;

class Render {
  constructor({logic, menu, oled, stream}) {
    this.logic    = logic;
    this.menu     = menu;
    this.oled     = oled;
    this.stream   = stream;

    this.activeEntry = null;
    this.display     = null;
    this.entries     = null;
    this.lastTime    = '';
    this.volume      = null;
  }

  async renderSelect() {
    if(this.display === this.logic.display) {
      if(this.entries === this.menu.entries && this.activeEntry === this.menu.activeEntry) {
        return;
      }
    } else {
      this.display   = this.logic.display;
    }

    this.activeEntry = this.menu.activeEntry;
    this.entries     = this.menu.entries;

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

  async renderTime() {
    const currentMoment = moment();
    const currentTime   = currentMoment.format('HH:mm:ss');

    if(this.display === this.logic.display) {
      if(this.lastTime === currentTime) {
        return;
      }
    } else {
      this.display = this.logic.display;
    }

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

  async renderVolume() {
    if(this.display === this.logic.display) {
      if(this.volume === this.stream.volume) {
        return;
      }
    } else {
      this.display = this.logic.display;
    }

    this.volume = this.stream.volume;

    this.oled.clearDisplay(false);

    this.oled.setCursor(0, 5);
    this.oled.writeString(font20, 1, 'Lautstärke', 'WHITE', false, 10, false);

    this.oled.drawRect(0, 35, 127, 20, 'WHITE', false);
    this.oled.fillRect(0, 35, Math.round(127 * Math.log((50 * this.stream.volume) + 1) / Math.log((50 * 2) + 1)), 20, 'WHITE', false);

    await this.oled.update();
  }

  async refresh() {
    switch(this.logic.display) {
      case 'menu':   this.renderSelect(); break;
      case 'time':   this.renderTime(); break;
      case 'volume': this.renderVolume(); break;

      default: throw new Error(`refresh(): unhandled display ${this.logic.display}`);
    }
  }
}

module.exports = Render;
