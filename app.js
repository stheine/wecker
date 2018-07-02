#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */
/* eslint-disable camelcase */
/* eslint-disable no-sync */

const Oled  = require('../sh1106-js'); // TODO npm module

const input  = require('./lib/input');
const loop   = require('./lib/loop');
const render = require('./lib/render');

(async() => {
  // Catch CTRL-C
// TODO  process.stdin.setRawMode(true);
// TODO  process.stdin.on('keypress', (chunk, key) => {
// TODO    console.log(key);
// TODO
// TODO    if(key && key.name === "c" && key.ctrl) {
// TODO      console.log("bye bye");
// TODO      process.exit();
// TODO    }
// TODO  });

  // Oled
  const oled = new Oled();

  await oled.initialize();
  await oled.dimDisplay(0x00);
//  await oled.clearDisplay(true);


  // Register the handlers for the input events
  await input.initialize({
    press: render.press,
    up:    render.up,
    left:  render.left,
    right: render.right,
  });

  // Startup main loop
  await loop({oled});
})();
