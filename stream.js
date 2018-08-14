#!/usr/bin/env node

'use strict';

const request = require('request');

const Speaker = require('speaker');
const lame    = require('lame');
const Volume  = require('pcm-volume');

const decoder = new lame.Decoder();
const speaker = new Speaker({
  channels:   2,
  bitDepth:   16,
  mode:       lame.STEREO,
  device:     'hw:1,0',
});

// volume
const volume = new Volume();

volume.setVolume(0.15);

const req = request
// .get('http://burnfm.radionetz.de:8000/burn-fm.mp3');
.get('http://st01.dlf.de/dlf/01/128/mp3/stream.mp3');

req
.pipe(decoder)
.pipe(volume)
.pipe(speaker);
