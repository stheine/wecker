#!/usr/bin/env node

'use strict';

const request = require('request');
const Speaker = require('speaker');
const lame    = require('lame');
const rpio    = require('rpio');

const speaker = new Speaker({
  channels: 2,
  bitDepth: 16,
  sampleRate: 44100,
  mode: lame.STEREO,
});

const decoder = new lame.Decoder();

rpio.init({
  gpiomem: false,
  mapping: 'physical',
});
// rpio.i2cBegin();
rpio.open(35, rpio.OUTPUT, rpio.LOW); // shutdown
rpio.open(37, rpio.OUTPUT, rpio.LOW); // mute

rpio.write(35, rpio.HIGH);
rpio.sleep(1);
rpio.write(37, rpio.HIGH);

request
  .get('http://burnfm.radionetz.de:8000/burn-fm.mp3')
//  .get('http://st01.dlf.de/dlf/01/128/mp3/stream.mp3')
  .pipe(decoder)
  .pipe(speaker);
