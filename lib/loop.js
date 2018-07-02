'use strict';

/* eslint-disable no-console */

const delay   = require('delay');
const doWhile = require('dank-do-while');

const render  = require('./render');

const running = true; // TODO

const loopMain = async({next}) => {
//  console.log('loopMain start');

  await render.refresh();

  if(!running) {
    return next(false);
  }

  await delay(80); // TODO

//  console.log('loopMain finish');

  return next(true);
};

module.exports = async() => {
  await render.initialize();

  doWhile(async next => {
    await loopMain({next});

//    console.log('loop, doWhile');
  }, () => {
    console.log('Terminated loopMain');
  });
};
