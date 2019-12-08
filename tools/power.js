#!/usr/bin/env node

'use strict';

const rpio = require('rpio');

rpio.init({
  mapping: 'physical',
});

rpio.open(37, rpio.OUTPUT, rpio.HIGH); // enable
