#!/usr/bin/env node

'use strict';

const rpio = require('rpio');

rpio.init({
  mapping: 'physical',
});
rpio.open(37, rpio.OUTPUT, rpio.LOW); // mute
rpio.open(35, rpio.OUTPUT, rpio.HIGH); // enable
rpio.sleep(0.75);
rpio.write(37, rpio.HIGH); // unmute
