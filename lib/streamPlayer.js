'use strict';

const path    = require('path');
const process = require('process');

const delay   = require('delay');
const lame    = require('lame');
const request = require('request');
const Speaker = require('speaker');
const Volume  = require('pcm-volume');

const volume  = new Volume();
const speaker = new Speaker({
  channels:   2,
  bitDepth:   16,
  sampleRate: 44100,
  mode:       lame.STEREO,
  device:     'hw:1,0',
});

volume.setVolume(0);

const url = process.argv[2];
let   decoder;

switch(path.extname(url)) {
  case '.mp3': decoder = new lame.Decoder(); break;

  default: throw new Error(`Unhandled stream format ${path.extname(url)}`);
}

const req = request.get(url);

req
  .pipe(decoder)
  .pipe(volume)
  .on('end', async() => {
    await delay(10000);
    process.exit(0);
  })
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

// process.on('exit', code => {
//   process.send({status: 'exit', code});
// });
