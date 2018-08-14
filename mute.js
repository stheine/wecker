#!/usr/bin/env node

'use strict';

const rpio    = require('rpio');

rpio.init({
  mapping: 'physical',
});

rpio.open(35, rpio.OUTPUT, rpio.LOW); // mute
rpio.sleep(0.1);
rpio.open(37, rpio.OUTPUT, rpio.LOW); // shutdown
