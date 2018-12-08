'use strict';

const delay   = require('delay');
const doWhile = require('dank-do-while');

class Loop {
  constructor({logic}) {
    this.logic  = logic;

    this.running = true; // TODO
  }

  async loopMain({next}) {
//  console.log('loopMain start');

    await this.logic.refresh();

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
//      console.log('Terminated loopMain');
    });
  }
}

module.exports = Loop;
