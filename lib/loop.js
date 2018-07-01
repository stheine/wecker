'use strict';

/* eslint-disable no-console */

const delay   = require('delay');
const doWhile = require('dank-do-while');
// const font7   = require('oled-font-5x7');
const moment  = require('moment');

// const font16  = require('../fonts/oled-js-font-Consolas-16');
const font16  = require('../fonts/oled-js-font-DejaVuSansMono-16');
const font46  = require('../fonts/oled-js-font-Consolas-46');
const glob    = require('./glob');
const menu    = require('./menu');

const running = true; // TODO
let lastTime = '';

const renderMenu = async({oled}) => {
  await menu.show({oled});
};

const renderTime = async({oled}) => {
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

const loopMain = async({next, oled}) => {
//  console.log('loopMain start');

  if(glob.globals.menu) {
    renderMenu({oled});
  } else {
    renderTime({oled});
  }

  if(!running) {
    return next(false);
  }

  await delay(80); // TODO

//  console.log('loopMain finish');

  return next(true);
};

module.exports = async({oled}) => {
  doWhile(async next => {
    await loopMain({next, oled});

//    console.log('loop, doWhile');
  }, () => {
    console.log('Terminated loopMain');
  });
};
