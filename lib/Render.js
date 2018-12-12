'use strict';

const _      = require('lodash');
const check  = require('check-types');
const moment = require('moment');

// const font7   = require('oled-font-5x7');
const font12  = require('../fonts/oled-js-font-Consolas-12');
const font16  = require('../fonts/oled-js-font-Consolas-16');
const font20  = require('../fonts/oled-js-font-Consolas-20');
const font46  = require('../fonts/oled-js-font-Consolas-46');

const font    = font12;
const lineHeight = font.height;
const padding = 4;
const numShow = 4;

class Render {
  constructor({oled}) {
    this.oled = oled;

    this.display     = null;
    this.lastTime    = '';
    this.volume      = null;
    this.activeMenu  = null;
    this.activeEntryNumber = null;
  }

  getVisibleEntries(menu) {
    const activeEntry   = menu.getActiveEntryNumber();
    const entries       = menu.getEntries();
    const entriesLength = menu.getEntriesLength();
    let   first;
    let   last;

    if(activeEntry < numShow) {
      first = 0;
    } else {
      first = activeEntry - numShow + 1;
    }

    if(numShow > entriesLength) {
      last = entriesLength;
    } else if(first + numShow <= entriesLength) {
      last = first + numShow - 1;
    } else {
      last = entriesLength - 1;
      first = last - numShow + 1;
    }

    return {
      activeEntry: activeEntry - first,
      entries:     _.slice(entries, first, last + 1),
    };
  }

  async renderMenu(params) {
    check.assert.object(params.menu);

    if(this.display === params.display) {
      if(this.menu === params.menu && this.activeEntryNumber === params.menu.getActiveEntryNumber()) {
        return;
      }
    } else {
      this.display   = params.display;
    }

    this.menu  = params.menu;
    this.activeEntryNumber = params.menu.getActiveEntryNumber();

    const {activeEntry, entries} = this.getVisibleEntries(params.menu);

    this.oled.clearDisplay(false);

    let y = 0;
    let menuWidth;

    if(params.menu.getEntriesLength() > numShow) {
      menuWidth = 118;
    } else {
      menuWidth = 127;
    }

    for(let key = 0; key < entries.length; key++) {
      const entry = entries[key];

      if(key === activeEntry) {
        this.oled.setCursor(padding, y + 0);
        this.oled.writeString(font, 1, entry.label, 'WHITE', false, 10, false);
        this.oled.drawDashedRect(0, y, menuWidth, lineHeight, 'WHITE', 1, false);
        this.oled.drawDashedRect(1, y + 1, menuWidth - 2, lineHeight - 2, 'WHITE', 1, false);
      } else {
        this.oled.setCursor(padding, y + 0);
        this.oled.writeString(font, 1, entry.label, 'WHITE', false, 10, false);
      }

      y += lineHeight;
    }

    if(params.menu.getEntriesLength() > numShow) {
      const above = this.activeEntryNumber - activeEntry;
      const below = params.menu.getEntriesLength() - numShow - above;

      const startY =  1 + _.round(above / params.menu.getEntriesLength() * 62);
      const endY   = 63 - _.round(below / params.menu.getEntriesLength() * 62);
      const height = endY - startY;

      this.oled.drawRect(120, 0, 8, 64, 'WHITE', false);
      this.oled.fillRect(121, 1, 6, 62, 'BLACK', false);
      this.oled.fillDashedRect(121, startY, 6, height, 'WHITE', 1, false);
    }

    await this.oled.update();
  }

  async renderTime(params) {
    check.assert.object(params.moment);
    check.assert(moment.isMoment(params.moment));

    const time = params.moment.format('HH:mm:ss');

    if(this.display === params.display) {
      if(this.lastTime === time) {
        return;
      }
    } else {
      this.display = params.display;
    }

    this.lastTime = time;

    this.oled.clearDisplay(false);
    this.oled.setCursor(0,  -10);
    this.oled.writeString(font46, 1, params.moment.format('HH'), 'WHITE', true, 0, false);
    this.oled.setCursor(50, -10);
    this.oled.writeString(font46, 1, ':', 'WHITE', true, 0, false);
    this.oled.setCursor(72, -10);
    this.oled.writeString(font46, 1, params.moment.format('mm'), 'WHITE', true, 0, false);
    this.oled.setCursor(92, 35);
    this.oled.writeString(font16, 1, params.moment.format(':ss'), 'WHITE', true, 0, false);

    await this.oled.update();
  }

  async renderVolume(params) {
    check.assert.number(params.volume);

    if(this.display === params.display) {
      if(this.volume === params.volume) {
        return;
      }
    } else {
      this.display = params.display;
    }

    this.volume = params.volume;
    const volumeX = Math.round(127 * Math.log((50 * params.volume) + 1) / Math.log((50 * 2) + 1));

    this.oled.clearDisplay(false);

    this.oled.setCursor(0, 5);
    this.oled.writeString(font20, 1, 'Lautstärke', 'WHITE', false, 10, false);

    this.oled.drawRect(0, 35, 127, 20, 'WHITE', false);
    this.oled.fillRect(0, 35, volumeX, 20, 'WHITE', false);

    await this.oled.update();
  }

  async refresh(params) {
    check.assert.object(params, 'params is not an object');
    check.assert.string(params.display, 'display is not a string');

    switch(params.display) {
      case 'menu':   this.renderMenu(params); break;
      case 'time':   this.renderTime(params); break;
      case 'volume': this.renderVolume(params); break;

      default: throw new Error(`refresh(): unhandled display ${params.display}`);
    }
  }
}

module.exports = Render;
