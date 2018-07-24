'use strict';

/* eslint-disable no-new */

const rpio   = require('rpio');
const Oled   = require('../sh1106-js/oled.js'); // TODO npm module

const Input  = require('./lib/Input');
const Loop   = require('./lib/Loop');
const Menu   = require('./lib/Menu');
const Render = require('./lib/Render');
const Stream = require('./lib/Stream');

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

  // Rpio
  rpio.init({
    gpiomem: false,
    mapping: 'physical',
  });

  // Oled
  const oled = new Oled({rpio});

  await oled.initialize();
  await oled.dimDisplay(0x00);
  await oled.clearDisplay(true);
  await oled.update();

  // Stream
  const stream = new Stream({rpio});

  // Menu
  const menu   = new Menu({stream});

  // Render
  const render = new Render({menu, oled});

  // Register the handlers for the input events
  new Input({handler: {
    press: render.press.bind(render),
    up:    render.up.bind(render),
    left:  render.left.bind(render),
    right: render.right.bind(render),
  }});

//  stream.toggle();

  const loop = new Loop({render});

  // Startup main loop
  await loop.start();
})();
