#!/usr/bin/env node

'use strict';

const rpio    = require('rpio');

rpio.init({
  mapping: 'physical',
});

rpio.open(36, rpio.OUTPUT, rpio.LOW); // mute
