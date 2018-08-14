'use strict';

const lame    = require('lame');
const request = require('request');
const Speaker = require('speaker');
const Volume  = require('pcm-volume');

const decoder = new lame.Decoder();
const volume  = new Volume();
const speaker = new Speaker({
  channels:   2,
  bitDepth:   16,
  sampleRate: 44100,
  mode:       lame.STEREO,
  device:     'hw:1,0',
});

volume.setVolume(0);

const req = request.get('http://burnfm.radionetz.de:8000/burn-fm.mp3');
//  .get('http://st01.dlf.de/dlf/01/128/mp3/stream.mp3')

req
  .pipe(decoder)
  .pipe(volume)
  .pipe(speaker);

process.on('message', message => {
  switch(message.action) {
    case 'abort':
      req.abort();
//      process.send({status: 'aborted'});
      process.exit(0);
      break;

    case 'volume':
      volume.setVolume(message.level);
      break;

    default: throw new Error(`Unhandled action ${message.action}`);
  }
});

process.on('exit', code => {
  process.send({status: `exiting ${code}`});
});
