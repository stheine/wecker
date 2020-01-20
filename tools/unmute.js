#!/usr/bin/env node

'use strict';

const rpio = require('rpio');

rpio.init({
  mapping: 'physical',
});

rpio.write(36, rpio.HIGH); // unmute
