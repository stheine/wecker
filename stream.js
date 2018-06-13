#!/usr/bin/env node

'use strict';

const request = require('request');
const Speaker = require('speaker');
const lame    = require('lame');

const speaker = new Speaker({
  channels: 2,
  bitDepth: 16,
  sampleRate: 44100,
  mode: lame.STEREO,
});

const decoder = new lame.Decoder();

request
  .get('http://st01.dlf.de/dlf/01/128/mp3/stream.mp3')
  .pipe(decoder)
  .pipe(speaker);
