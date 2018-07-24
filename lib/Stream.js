'use strict';

const delay   = require('delay');
const request = require('request');
const Speaker = require('speaker');
const lame    = require('lame');

// const stream  = require('../streamMod');

const MUTE     = 37;
const SHUTDOWN = 35;

class Stream {
  constructor({rpio}) {
    this.playing = false;

    this.rpio = rpio;

    this.rpio.open(MUTE, rpio.OUTPUT, rpio.LOW);
    this.rpio.sleep(0.2);
    this.rpio.open(SHUTDOWN, rpio.OUTPUT, rpio.LOW);

    this.req = null;

    this.toggle = this.toggle.bind(this);
  }

  async toggle() {
    if(this.playing) {
      if(this.req) {
        this.req.abort();
        this.req = null;
      }

      this.rpio.write(MUTE, this.rpio.LOW);
      await delay(100);
      this.rpio.write(SHUTDOWN, this.rpio.LOW);

      this.playing = false;
    } else {
      const decoder = new lame.Decoder();
      const speaker = new Speaker({
        channels:   2,
        bitDepth:   16,
        sampleRate: 44100,
        mode:       lame.STEREO,
      });

//    decoder.on('format', function() {
//      mpg123Util.setVolume(decoder.mh, 0.5);
//
//      const vol = mpg123Util.getVolume(decoder.mh);
//
//      console.log(vol);
//    });

      this.req = request.get('http://burnfm.radionetz.de:8000/burn-fm.mp3');
      //  .get('http://st01.dlf.de/dlf/01/128/mp3/stream.mp3')

      this.req
//        .pipe(process.stdout);
        .pipe(decoder)
        .pipe(speaker);

      this.rpio.write(MUTE, this.rpio.LOW);
      this.rpio.write(SHUTDOWN, this.rpio.HIGH);
      await delay(750);
      this.rpio.write(MUTE, this.rpio.HIGH);

      this.playing = true;
    }
  }
}

module.exports = Stream;
