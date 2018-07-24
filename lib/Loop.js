'use strict';

/* eslint-disable no-console */

const delay   = require('delay');
const doWhile = require('dank-do-while');

class Loop {
  constructor({render}) {
    this.render = render;

    this.running = true; // TODO
  }

  async loopMain({next}) {
//  console.log('loopMain start');

    await this.render.refresh();

    if(!this.running) {
      return next(false);
    }

    await delay(80); // TODO

//  console.log('loopMain finish');

    return next(true);
  }

  async start() {
    doWhile(async next => {
      await this.loopMain({next});

//    console.log('loop, doWhile');
    }, () => {
      console.log('Terminated loopMain');
    });
  }
}

module.exports = Loop;
