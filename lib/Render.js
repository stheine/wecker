/* eslint-disable class-methods-use-this */

import _      from 'lodash';
import check  from 'check-types-2';
import dayjs  from 'dayjs';

/* eslint-disable no-unused-vars */
// Manually(?) optimized
import font7  from 'oled-font-5x7';
// Generated on https://stheine.github.io/oled-js-font-foundry/
import font12 from '../fonts/oled-js-font-Consolas-12-190.js'; // 5 lines menu
import font14 from '../fonts/oled-js-font-Consolas-14-211.js'; // 4 lines menu
import font16 from '../fonts/oled-js-font-Consolas-16-215.js';
import font18 from '../fonts/oled-js-font-Consolas-18-225.js'; // 3 lines menu
import font20 from '../fonts/oled-js-font-Consolas-20-230.js';
import font26 from '../fonts/oled-js-font-Consolas-26-230.js'; // 2 lines menu
import font46 from '../fonts/oled-js-font-Consolas-46-150.js';
import font50 from '../fonts/oled-js-font-Consolas-50-150.js';
import font55 from '../fonts/oled-js-font-Consolas-55-146.js';
/* eslint-enable no-unused-vars */

const fontMenu = font50;

const lineHeight  = fontMenu.height - 1;
const paddingLeft = 4;
const numShow     = Math.floor(66 / lineHeight); // 66 to allow 5 lines with font12

class Render {
  constructor({oled}) {
    this.oled                    = oled;

    this.displayDim              = this.dim;
    this.display                 = null;
    this.lastTime                = '';
    this.volume                  = null;
    this.activeEntryNumber       = null;
    this.entriesLength           = null;
    this.infoLargeScrollInterval = null;
    this.infoLargeScrollStart    = null;
    this.scrollingText           = null;
    this.timeDisplayLower        = null;

    if(dayjs().hour() < 6 ||
      (dayjs().hour() === 6 && dayjs().minute() < 30) ||
      (dayjs().hour() === 22 && dayjs().minute() >= 30) ||
      dayjs().hour() > 22
    ) {
      this.dim = 0;
    } else {
      this.dim = 255;
    }
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

    const activeEntryNumber = params.menu.getActiveEntryNumber();
    const entriesLength     = params.menu.getEntriesLength();

    if(this.display === params.display) {
      if(this.menu === params.menu &&
        this.activeEntryNumber === activeEntryNumber &&
        this.entriesLength === entriesLength
      ) {
        return;
      }
    } else {
      this.display   = params.display;
    }

    this.menu              = params.menu;
    this.activeEntryNumber = activeEntryNumber;
    this.entriesLength     = entriesLength;

    const {activeEntry, entries} = this.getVisibleEntries(params.menu);

    this.oled.clearDisplay(false);

    let y = 0;
    let menuWidth;

    if(params.menu.getEntriesLength() > numShow) {
      menuWidth = 118;
    } else {
      menuWidth = 127;
    }

    let selectedY;

    for(const [key, entry] of entries.entries()) {
      let label;

      if(_.isFunction(entry.label)) {
        label = entry.label(params.alarms);
      } else {
        label = entry.label;
      }

      this.oled.writeString(paddingLeft, y - 1, fontMenu, label, 'WHITE', false);

      if(key === activeEntry) {
        selectedY = y;
      }

      y += lineHeight;
    }

    this.oled.drawDashedRect(0, selectedY,     menuWidth,     lineHeight,     'WHITE', 1, false);
    this.oled.drawDashedRect(1, selectedY + 1, menuWidth - 2, lineHeight - 2, 'WHITE', 1, false);

    if(params.menu.getEntriesLength() > numShow) {
      const above = this.activeEntryNumber - activeEntry;
      const below = params.menu.getEntriesLength() - numShow - above;

      const startY =  1 + _.round(above / params.menu.getEntriesLength() * 62);
      const endY   = 63 - _.round(below / params.menu.getEntriesLength() * 62);
      const height = endY - startY;

      this.oled.fillRect(118, 0, 2, 64, 'BLACK', false);
      this.oled.drawRect(120, 0, 8, 64, 'WHITE', false);
      this.oled.fillRect(121, 1, 6, 62, 'BLACK', false);
      this.oled.fillDashedRect(121, startY, 6, height, 'WHITE', 1, false);
    }

    await this.oled.update();
  }

  async clearScroll() {
    clearInterval(this.infoLargeScrollInterval);
    this.infoLargeScrollInterval = null;

    await this.oled.fillRect(0, 40, 128, 24, 'BLACK', false);
  }

  renderScrollText(text) {
    const scrollText = `   ${text}`;

    this.infoLargeScrollStart += 1;
    if(this.infoLargeScrollStart > scrollText.length * font16.width) {
      this.infoLargeScrollStart = 0;
    }

    let displayString = scrollText.slice(this.infoLargeScrollStart / font16.width);
    const x = -(this.infoLargeScrollStart % font16.width);

    if(displayString.length < 13) {
      displayString += scrollText;
    }

    this.oled.fillRect(0, 40, 128, font16.height, 'BLACK', false);
    this.oled.writeString(x, 40, font16, displayString, 'WHITE', false);
  }

  async renderPaused(params) {
    if(this.display === params.display) {
      return;
    }

    this.display = params.display;

    this.oled.fillRect(48, 10, 10, 43, 'WHITE', false);
    this.oled.fillRect(68, 10, 10, 43, 'WHITE', false);

    await this.oled.update();
  }

  async renderTime(params) {
    check.assert.object(params.dayjs);
    // check.assert(dayjs.isMoment(params.dayjs));
    check.assert.object(params.info);

    const time = params.dayjs.format('HH:mm:ss');

    if(this.display === params.display) {
      if(this.lastTime === time) {
        return;
      }
    } else {
      this.display = params.display;
    }

    this.lastTime = time;

    this.oled.writeString(-4, -15, font55, _.padStart(params.dayjs.format('H'), 2), 'WHITE', false);
    this.oled.writeString(70, -15, font55, params.dayjs.format('mm'), 'WHITE', false);
    this.oled.drawCircle(63, 13, 2,   'WHITE', false);
    this.oled.drawCircle(63, 13, 1.5, 'WHITE', false);
    this.oled.drawCircle(63, 13, 1,   'WHITE', false);
    this.oled.drawCircle(63, 13, 0.5, 'WHITE', false);
    this.oled.drawCircle(63, 13, 0,   'WHITE', false);
    this.oled.drawCircle(63, 26, 2,   'WHITE', false);
    this.oled.drawCircle(63, 26, 1.5, 'WHITE', false);
    this.oled.drawCircle(63, 26, 1,   'WHITE', false);
    this.oled.drawCircle(63, 26, 0.5, 'WHITE', false);
    this.oled.drawCircle(63, 26, 0,   'WHITE', false);

//    this.oled.drawRect(0, 0, 128, 40, 'WHITE', false);

    await this.oled.update(0, 4); // 0-39, enough to refresh the time

    if(_.get(params, 'info.large')) {
//      console.log('updateLower.large', params.info);

      if(params.info.large.length > 13) {
        // Scrolling
        if(this.scrollingText !== params.info.large) {
          // Text change
          await this.clearScroll();

          this.scrollingText = params.info.large;
        }

        if(!this.infoLargeScrollInterval) {
          this.renderScrollText(params.info.large);

          this.infoLargeScrollInterval = setInterval(async() => {
            this.renderScrollText(params.info.large);

            await this.oled.update(5, 7);
          }, 30);
        }
      } else {
        if(this.infoLargeScrollInterval) {
          await this.clearScroll();
        }

        this.oled.writeString(0, 40, font16, params.info.large, 'WHITE', false);

        await this.oled.update(5, 7);
      }

//      if(params.info.bottom) {
//        this.oled.writeString(0, 61, font7, params.info.bottom, 'WHITE', false);
//      }

      this.timeDisplayLower = true;
    } else if(_.get(params, 'info.bottom')) {
//      console.log('updateLower.bottom', params.info);

      this.oled.fillRect(0, 40, 128, 24, 'BLACK', false);
      this.oled.writeString(10, 45, font20, params.info.bottom, 'WHITE', false);

      this.timeDisplayLower = true;

      await this.oled.update(5, 7);
    } else if(this.timeDisplayLower) {
//      console.log('cleanLower');

      await this.oled.fillRect(0, 40, 128, 24, 'BLACK', false);

      await this.oled.update(5, 7);

      this.timeDisplayLower = false;
    }
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
    const volumeX = Math.round(127 * Math.log(params.volume + 1) / Math.log((4 * 2) + 1));

    this.oled.clearDisplay(false);

    this.oled.writeString(0, 5, font20, 'Lautstärke', 'WHITE', false);

    this.oled.drawRect(0, 35, 127, 20, 'WHITE', false);
    this.oled.fillRect(0, 35, volumeX, 20, 'WHITE', false);

    this.oled.writeString(0, 57, font7, String(Math.round(params.volume * 100) / 100), 'WHITE', false);

    await this.oled.update();
  }

  async renderDim(params) {
    check.assert.number(params.dim);

    if(this.display === params.display) {
      if(this.displayDim === params.dim) {
        return;
      }
    } else {
      this.display = params.display;
    }

    this.displayDim = params.dim;
    const dimX = Math.round(127 * this.displayDim / 255);

    this.oled.clearDisplay(false);

    this.oled.writeString(0, 5, font20, 'Helligkeit', 'WHITE', false);

    this.oled.drawRect(0, 35, 127, 20, 'WHITE', false);
    this.oled.fillRect(0, 35, dimX, 20, 'WHITE', false);

    this.oled.writeString(0, 57, font7, String(this.displayDim), 'WHITE', false);

    await this.oled.update();
  }

  async refresh(params) {
    check.assert.object(params, 'params is not an object');
    check.assert.string(params.display, 'display is not a string');

    await this.oled.dimDisplay(this.dim);

    if(this.infoLargeScrollInterval &&
      (params.display !== 'time' || !params.info.large)
    ) {
      await this.clearScroll();
    }

    if(this.display !== params.display) {
      await this.oled.clearDisplay(true);
    }

    switch(params.display) {
      case 'dim':    this.renderDim(params); break;
      case 'menu':   this.renderMenu(params); break;
      case 'paused': this.renderPaused(params); break;
      case 'time':   this.renderTime(params); break;
      case 'volume': this.renderVolume(params); break;

      default: throw new Error(`refresh(): unhandled display ${params.display}`);
    }
  }
}

export default Render;
