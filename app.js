#!/usr/bin/env node

'use strict';

// const five       = require('johnny-five');
const InputEvent = require('input-event');
// const Oled       = require('oled-js');
// const raspiIo    = require('raspi-io');

// Rotary Button

const rotaryButtonInput = new InputEvent('/dev/input/event1');
const rotaryButton      = new InputEvent.Keyboard(rotaryButtonInput);

rotaryButton.on('keyup',    data => console.log('keyup', data));
rotaryButton.on('keydown',  data => console.log('keydown', data));
rotaryButton.on('keypress', data => console.log('keypress', data));

// Rotary Encoder

const rotaryEncoderInput = new InputEvent('/dev/input/event0');
const rotaryEncoder      = new InputEvent.Rotary(rotaryEncoderInput);

rotaryEncoder.on('left',  data => console.log('left', data));
rotaryEncoder.on('right', data => console.log('right', data));


// OLED

// const io    = new raspiIo();
// const board = new five.Board({io, repl: false});
//
// board.on('ready', () => {
//   console.log('ready');
//
//   const oled = new Oled(board, five, {
//     width:   128,
//     height:  64,
//     address: 0x3c,
//   });
//
//   oled.invertDisplay(true);
// });
//
// // board.on('exit', () => {
// //   process.exit(0);
// // });
