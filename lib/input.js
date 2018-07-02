'use strict';

/* eslint-disable camelcase */
/* eslint-disable no-sync */

const child_process = require('child_process');

const _             = require('lodash');
const check         = require('check-types');
const InputEvent    = require('input-event');

const initialize = async function(handler) {
  // Detect the event inputs

  const lsinputOut   = String(child_process.execFileSync('/usr/bin/lsinput')); // sudo apt install input-utils
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

  // Rotary Button
  const rotaryButtonEvent = _.findKey(devices, {name: '"15.button"'});
  const rotaryButtonInput = new InputEvent(rotaryButtonEvent);
  const rotaryButton      = new InputEvent.Keyboard(rotaryButtonInput);

  rotaryButton.on('keypress', async(/* data */) => {
    check.assert.function(handler.press, 'handler.press not a function');

    handler.press();
  });
  rotaryButton.on('keyup', async(/* data */) => {
    check.assert.function(handler.up, 'handler.up not a function');

    handler.up();
  });



  // Rotary Encoder
  const rotaryEncoderEvent = _.findKey(devices, {name: '"10.rotary"'});
  const rotaryEncoderInput = new InputEvent(rotaryEncoderEvent);
  const rotaryEncoder      = new InputEvent.Rotary(rotaryEncoderInput);

  rotaryEncoder.on('left', async(/* data */) => {
    check.assert.function(handler.left, 'handler.left not a function');

    handler.left();
  });
  rotaryEncoder.on('right', async(/* data */) => {
    check.assert.function(handler.right, 'handler.right not a function');

    handler.right();
  });
};

module.exports = {
  initialize,
};
