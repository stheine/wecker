'use strict';

/* eslint-disable camelcase */
/* eslint-disable no-sync */

const child_process = require('child_process');

const _             = require('lodash');
const check         = require('check-types');
const InputEvent    = require('input-event');

class Input {
  constructor({handler}) {
    // Detect the event inputs

//    console.log('Input:constructor');

    // sudo apt install input-utils
    const lsinputOut   = String(child_process.execFileSync('/usr/bin/lsinput'));
    const lsinputArray = lsinputOut.split(/\n/);
    const devices = {};
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

    // Register the callback functions

    // Rotary Encoder
    const rotaryEncoderEvent = _.findKey(devices, {name: '"10.rotary"'});
//    const rotaryEncoderInput = new InputEvent(rotaryEncoderEvent);
//    const rotaryEncoder      = new InputEvent.Rotary(rotaryEncoderInput);
    const rotaryEncoder      = new InputEvent.Rotary(rotaryEncoderEvent);

    rotaryEncoder.on('left', async(/* data */) => {
      check.assert.function(handler.left, 'handler.left not a function');

      handler.left();
    });
    rotaryEncoder.on('right', async(/* data */) => {
      check.assert.function(handler.right, 'handler.right not a function');

      handler.right();
    });

    // Rotary Button
    const rotaryButtonEvent = _.findKey(devices, {name: '"15.button"'});
//    const rotaryButtonInput = new InputEvent(rotaryButtonEvent);
//    const rotaryButton      = new InputEvent.Keyboard(rotaryButtonInput);
    const rotaryButton      = new InputEvent.Keyboard(rotaryButtonEvent);

    rotaryButton.on('keypress', async(/* data */) => {
      check.assert.function(handler.press, 'handler.press not a function');

      handler.press();
    });
    rotaryButton.on('keyup', async(/* data */) => {
      check.assert.function(handler.up, 'handler.up not a function');

      handler.up();
    });
  }
}

module.exports = Input;
