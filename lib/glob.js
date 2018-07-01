'use strict';

const menu = require('./menu');

const globals = {
  menu:    false,
};

const press = function() {
  globals.menu = !globals.menu;
};

const up = function() {
  // Button up
};

const left = function() {
  // Left

  menu.previous();
};

const right = function() {
  // Right

  menu.next();
};

module.exports = {
  globals,
  press,
  up,
  left,
  right,
};
