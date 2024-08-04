#!/usr/bin/env node

import fsPromises from 'node:fs/promises';

import Oled       from 'sh1106-js';
import rpio       from 'rpio';

import Alarm      from './lib/Alarm.js';
import Data       from './lib/Data.js';
import Input      from './lib/Input.js';
import logger     from './lib/logger.js';
import Logic      from './lib/Logic.js';
import Loop       from './lib/Loop.js';
import Mqtt       from './lib/Mqtt.js';
import Render     from './lib/Render.js';
import Stream     from './lib/Stream.js';

(async() => {
  logger.info(`Startup --------------------------------------------------`);

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

  // Data
  const data = new Data();

  // Render
  const render = new Render({oled});

  // Stream
  const stream = new Stream({rpio});

  // Alarm
  const alarm = new Alarm({data, stream});

  // Logic
  const logic = new Logic({alarm, data, logger, render, stream});

  // Mqtt
  const mqtt = new Mqtt({logic});

  await mqtt.start();

  // Register the handlers for the input events
  const input = new Input({handler: {
    press1: logic.press1.bind(logic),
    up1:    logic.up1.bind(logic),
    left1:  logic.left1.bind(logic),
    right1: logic.right1.bind(logic),

    press2: logic.press2.bind(logic),
    up2:    logic.up2.bind(logic),
    left2:  logic.left2.bind(logic),
    right2: logic.right2.bind(logic),
  }});

  const loop = new Loop({alarm, input, logic, mqtt});

  // Startup main loop
  await loop.start();

  logger.info(`Shutdown -------------------------------------------------`);

  process.exit(0);
})();
