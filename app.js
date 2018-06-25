#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */

// const delay      = require('delay');
// const font       = require('oled-font-5x7');
const InputEvent = require('input-event');
const Oled       = require('../sh1106-js'); // TODO npm module

const loop       = require('./lib/loop');

(async() => {
  // Catch CTRL-C
// TODO  process.stdin.setRawMode(true);
// TODO  process.stdin.on('keypress', (chunk, key) => {
// TODO    console.log(key);
// TODO
// TODO    if(key && key.name === "c" && key.ctrl) {
// TODO      console.log("bye bye");
// TODO      process.exit();
// TODO    }
// TODO  });

  // Oled
  const oled = new Oled();
  let   contrast = 0x00;

  await oled.initialize();
  await oled.dimDisplay(contrast);



  // Rotary Button
  const rotaryButtonInput = new InputEvent('/dev/input/event1');
  const rotaryButton      = new InputEvent.Keyboard(rotaryButtonInput);

  rotaryButton.on('keypress', async(/* data */) => {
    console.log('Button press');
//    console.log('keypress', data);

    await oled.turnOffDisplay();
  });
  rotaryButton.on('keyup', async(/* data */) => {
    console.log('Button up');
//    console.log('keyup', data);

    await oled.turnOnDisplay();
  });



  // Rotary Encoder
  const rotaryEncoderInput = new InputEvent('/dev/input/event0');
  const rotaryEncoder      = new InputEvent.Rotary(rotaryEncoderInput);

  rotaryEncoder.on('left', async(/* data */) => {
    console.log('Button left');
//    console.log('left', data);

    await oled.dimDisplay(--contrast);
    console.log(`contrast ${contrast}`);
  });
  rotaryEncoder.on('right', async(/* data */) => {
    console.log('Button left');
//    console.log('right', data);

    await oled.dimDisplay(++contrast);
    console.log(`contrast ${contrast}`);
  });


  await loop({oled});
})();
