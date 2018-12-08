'use strict';

/* eslint-disable no-new */

const rpio   = require('rpio');
const Oled   = require('../sh1106-js/oled.js'); // TODO npm module

const Input  = require('./lib/Input');
const Logic  = require('./lib/Logic');
const Loop   = require('./lib/Loop');
const Render = require('./lib/Render');
const Stream = require('./lib/Stream');

(async() => {
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

  // Render
  const render = new Render({oled});

  // Stream
  const stream = new Stream({rpio});

  // Logic
  const logic = new Logic({render, stream});

  // Register the handlers for the input events
  new Input({handler: {
    press1: logic.press1.bind(logic),
    up1:    logic.up1.bind(logic),
    left1:  logic.left1.bind(logic),
    right1: logic.right1.bind(logic),

    press2: logic.press2.bind(logic),
    up2:    logic.up2.bind(logic),
    left2:  logic.left2.bind(logic),
    right2: logic.right2.bind(logic),
  }});

  const loop = new Loop({logic});

  // Startup main loop
  await loop.start();
})();
