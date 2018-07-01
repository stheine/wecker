#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */
/* eslint-disable camelcase */
/* eslint-disable no-sync */

const child_process = require('child_process');

const _             = require('lodash');
const check         = require('check-types');
// const delay      = require('delay');
// const font       = require('oled-font-5x7');
const InputEvent = require('input-event');
const Oled       = require('../sh1106-js'); // TODO npm module

const glob       = require('./lib/glob');
const loop       = require('./lib/loop');


// Detect the event inputs

const lsinputOut   = String(child_process.execFileSync('/usr/bin/lsinput')); // sudo apt install input-utils
const lsinputArray = lsinputOut.split(/\n/);
const devices      = {};
let   event;

for(const line of lsinputArray) {
  if(/^\/dev\/input\//.test(line)) {
    event = line;
    check.assert.undefined(devices[event], `duplicate event ${event} in ${lsinputOut}`);
    devices[event] = {};
  } else if(line === '') {
    event = null;
  } else {
    check.assert.assigned(event, `event not assigned in ${lsinputOut}`);

    let [field, value] = line.split(/:/);

    field = _.trim(field);
    value = _.trim(value);

    devices[event][field] = value;
  }
}

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

  await oled.initialize();
  await oled.dimDisplay(0x00);
//  await oled.clearDisplay(true);



  // Rotary Button
  const rotaryButtonEvent = _.findKey(devices, {name: '"15.button"'});
  const rotaryButtonInput = new InputEvent(rotaryButtonEvent);
  const rotaryButton      = new InputEvent.Keyboard(rotaryButtonInput);

  rotaryButton.on('keypress', async(/* data */) => {
//    console.log('Button press');

    glob.press();
  });
  rotaryButton.on('keyup', async(/* data */) => {
//    console.log('Button up');

    glob.up();
  });



  // Rotary Encoder
  const rotaryEncoderEvent = _.findKey(devices, {name: '"10.rotary"'});
  const rotaryEncoderInput = new InputEvent(rotaryEncoderEvent);
  const rotaryEncoder      = new InputEvent.Rotary(rotaryEncoderInput);

  rotaryEncoder.on('left', async(/* data */) => {
//    console.log('Button left');

    glob.left();
  });
  rotaryEncoder.on('right', async(/* data */) => {
//    console.log('Button left');

    glob.right();
  });



  // Startup main loop
  await loop({oled});
})();
