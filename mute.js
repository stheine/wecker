#!/usr/bin/env node

'use strict';

const rpio    = require('rpio');

rpio.init({
  mapping: 'physical',
});
rpio.open(37, rpio.OUTPUT, rpio.LOW); // mute
rpio.sleep(0.5);
rpio.open(35, rpio.OUTPUT, rpio.LOW); // shutdown

rpio.write(37, rpio.LOW);
rpio.sleep(0.5);
rpio.write(35, rpio.LOW);
