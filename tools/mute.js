#!/usr/bin/env node

'use strict';

const rpio    = require('rpio');

rpio.init({
  mapping: 'physical',
});

rpio.open(35, rpio.OUTPUT, rpio.LOW); // mute
