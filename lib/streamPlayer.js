'use strict';

const fs      = require('fs');
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

const input = process.argv[2];
let   decoder;
let   inputStream;

switch(path.extname(input)) {
  case '.mp3': decoder = new lame.Decoder(); break;

  default: throw new Error(`Unhandled stream format ${path.extname(input)}`);
}

if(/^https?:\/\//.test(input)) {
  inputStream = request.get(input);
} else {
  inputStream = fs.createReadStream(input);
}

const decoderStream = inputStream
  .pipe(decoder)
  .on('end', () => {
//    console.log('inputStream.end');
  });
const volumeStream = decoderStream
  .pipe(volume)
  .on('end', async() => {
//    console.log('decoderStream.end');
    await delay(500);
    process.exit(0);
  });

volumeStream.pipe(speaker);

process.on('message', message => {
  switch(message.action) {
    case 'abort':
      inputStream.abort();
//      process.send({status: 'aborted'});
      process.exit(0);
      break;

    case 'pause':
      volumeStream.unpipe(speaker);
      break;

    case 'resume':
      volumeStream.pipe(speaker);
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
