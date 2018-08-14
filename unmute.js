#!/usr/bin/env node

'use strict';

const rpio = require('rpio');

rpio.init({
  mapping: 'physical',
});
rpio.open(35, rpio.OUTPUT, rpio.LOW); // mute
rpio.open(37, rpio.OUTPUT, rpio.HIGH); // enable
rpio.sleep(1);
rpio.write(35, rpio.HIGH); // unmute
