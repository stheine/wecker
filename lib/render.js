'use strict';

const moment  = require('moment');

// const font7   = require('oled-font-5x7');
// const font16  = require('../fonts/oled-js-font-Consolas-16');
const font12  = require('../fonts/oled-js-font-Consolas-12');
const font16  = require('../fonts/oled-js-font-DejaVuSansMono-16');
const font46  = require('../fonts/oled-js-font-Consolas-46');

const menuXXX = require('./menu');
const Oled = require('../../sh1106-js'); // TODO npm module

const font    = font12;
const height  = font.height;
const padding = 4;

let   display  = 'time';
let   lastTime = '';
let   oled;

const initialize = async function() {
  // Oled
  oled = new Oled();

  await oled.initialize();
  await oled.dimDisplay(0x00);
};

const menu = async() => {
  const {active, entries} = menuXXX.display();
  let   y = 0;

  oled.clearDisplay(false);

  for(let key = 0; key < entries.length; key++) {
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

const time = async() => {
  const currentMoment = moment();
  const currentTime   = currentMoment.format('HH:mm:ss');

  if(currentTime !== lastTime) {
    lastTime = currentTime;

    oled.clearDisplay(false);
    oled.setCursor(0,  -10);
    oled.writeString(font46, 1, currentMoment.format('HH'), 'WHITE', true, 0, false);
    oled.setCursor(50, -10);
    oled.writeString(font46, 1, ':', 'WHITE', true, 0, false);
    oled.setCursor(72, -10);
    oled.writeString(font46, 1, currentMoment.format('mm'), 'WHITE', true, 0, false);
    oled.setCursor(92, 35);
    oled.writeString(font16, 1, currentMoment.format(':ss'), 'WHITE', true, 0, false);

    await oled.update();
  }

//  console.log(currentTime);
};

const refresh = async() => {
  switch(display) {
    case 'menu':
      menu();
      break;

    case 'time':
      time();
      break;

    default: throw new Error(`Unhandled display ${display}`);
  }
};

const press = function() {
  switch(display) {
    case 'menu':
      display = 'time';
      break;

    case 'time':
      display = 'menu';
      break;

    default: throw new Error(`Unhandled display ${display}`);
  }
};

const up = function() {
  // button up
};

const left = function() {
  switch(display) {
    case 'menu':
      menuXXX.previous();
      break;

    case 'time':
      break;

    default: throw new Error(`Unhandled display ${display}`);
  }
};

const right = function() {
  switch(display) {
    case 'menu':
      menuXXX.next();
      break;

    case 'time':
      break;

    default: throw new Error(`Unhandled display ${display}`);
  }
};

module.exports = {
  refresh,
  initialize,
  press,
  up,
  left,
  right,
};
