#!/usr/bin/env node

'use strict';

const rpio = require('rpio');

rpio.init({
  mapping: 'physical',
});

rpio.write(35, rpio.HIGH); // unmute
