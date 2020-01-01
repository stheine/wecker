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

    // Rotary Encoder - 1
    const rotaryEncoderEvent1 = _.findKey(devices, {name: '"rotary@10"'});

    this.rotaryEncoder1       = new InputEvent.Rotary(rotaryEncoderEvent1);

    this.rotaryEncoder1.on('left', async(/* data */) => {
      check.assert.function(handler.left1, 'handler.left1 not a function');

      handler.left1();
    });
    this.rotaryEncoder1.on('right', async(/* data */) => {
      check.assert.function(handler.right1, 'handler.right1 not a function');

      handler.right1();
    });

    // Rotary Button - 1
    const rotaryButtonEvent1 = _.findKey(devices, {name: '"button@15"'});

    this.rotaryButton1        = new InputEvent.Keyboard(rotaryButtonEvent1);

    this.rotaryButton1.on('keypress', async(/* data */) => {
      check.assert.function(handler.press1, 'handler.press1 not a function');

      handler.press1();
    });
    this.rotaryButton1.on('keyup', async(/* data */) => {
      check.assert.function(handler.up1, 'handler.up1 not a function');

      handler.up1();
    });

    // Rotary Encoder - 2
    const rotaryEncoderEvent2 = _.findKey(devices, {name: '"rotary@5"'});

    this.rotaryEncoder2       = new InputEvent.Rotary(rotaryEncoderEvent2);

    this.rotaryEncoder2.on('left', async(/* data */) => {
      check.assert.function(handler.left2, 'handler.left2 not a function');

      handler.left2();
    });
    this.rotaryEncoder2.on('right', async(/* data */) => {
      check.assert.function(handler.right2, 'handler.right2 not a function');

      handler.right2();
    });

    // Rotary Button - 2
    const rotaryButtonEvent2 = _.findKey(devices, {name: '"button@d"'});

    this.rotaryButton2       = new InputEvent.Keyboard(rotaryButtonEvent2);

    this.rotaryButton2.on('keypress', async(/* data */) => {
      check.assert.function(handler.press2, 'handler.press2 not a function');

      handler.press2();
    });
    this.rotaryButton2.on('keyup', async(/* data */) => {
      check.assert.function(handler.up2, 'handler.up2 not a function');

      handler.up2();
    });
  }

  terminate() {
    if(this.rotaryEncoder1) {
      this.rotaryEncoder1.close();
      this.rotaryEncoder1 = undefined;
    }
    if(this.rotaryButton1) {
      this.rotaryButton1.close();
      this.rotaryButton1 = undefined;
    }
    if(this.rotaryEncoder2) {
      this.rotaryEncoder2.close();
      this.rotaryEncoder2 = undefined;
    }
    if(this.rotaryButton2) {
      this.rotaryButton2.close();
      this.rotaryButton2 = undefined;
    }
  }
}

module.exports = Input;
