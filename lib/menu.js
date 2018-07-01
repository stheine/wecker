'use strict';

// const font7   = require('oled-font-5x7');

const font12  = require('../fonts/oled-js-font-Consolas-12');
// const font12  = require('../fonts/oled-js-font-DejaVuSansMono-12');
// const font16  = require('../fonts/oled-js-font-DejaVuSansMono-16');
// const glob    = require('./glob');

const font    = font12;
const height  = font.height;
const numShow = 4;
const padding = 4;

const entries = [{
  label: '<- Zurück',
}, {
  label: 'Weckzeiten',
}, {
  label: 'Einstellungen',
}, {
  label: 'Streaming',
}, {
  label: 'Lautstärke',
}, {
  label: 'Morgen',
}];

let active = 0;

const showItems = function() {
  let first;
  let last;

  if(active < numShow) {
    first = 0;
  } else {
    first = active - numShow + 1;
  }

  if(first + numShow <= entries.length) {
    last = first + numShow;
  } else {
    last = entries.length - 1;
    first = last - numShow + 1;
  }

  return {first, last};
};

const show = async function({oled}) {
  oled.clearDisplay(false);

  const {first, last} = showItems();
  let   y = 0;

  for(let key = first; key < last; key++) {
    const entry = entries[key];

    if(key === active) {
      oled.fillRect(0, y, 127, height, 'WHITE', false);
      oled.setCursor(padding, y);
      oled.writeString(font, 1, entry.label, 'BLACK', false, 10, false);
//      oled.drawLine(0, y, 127, y, 'BLACK', false);
//      oled.fillRect(0, y, 127, 1, 'BLACK', false);
    } else {
//      oled.drawRect(0, y, 127, height, 'WHITE', false);
      oled.setCursor(padding, y + 2);
      oled.writeString(font, 1, entry.label, 'WHITE', false, 10, false);
    }

    y += height;
  }

  await oled.update();
};

const next = function() {
  if(active === entries.length - 1) {
    active = 0;
  } else {
    active++;
  }
};

const previous = function() {
  if(active === 0) {
    active = entries.length - 1;
  } else {
    active--;
  }
};

module.exports = {
  show,
  next,
  previous,
};
