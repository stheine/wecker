'use strict';

/* eslint-disable no-console */

const delay   = require('delay');
const doWhile = require('dank-do-while');
const font    = require('oled-font-5x7');
const moment  = require('moment');

let running = true;
let lastTime = '';

const mainLoop = async({next, oled}) => {
  const currentTime = moment().format('HH:mm:ss');

  if(currentTime !== lastTime) {
    lastTime = currentTime;

//      await oled.clearDisplay();

    await oled.setCursor(0, 0);
    await oled.writeString(font, 2, currentTime, 1, false);
    await oled.update();
  }

//  console.log(currentTime);

  if(!running) {
    return next(false);
  }

  await delay(100);

  return next(true);
};

module.exports = async({oled}) => {
  doWhile(next => {
    mainLoop({next, oled});
  }, () => {
    console.log('Terminated mainLoop');
  });
};
