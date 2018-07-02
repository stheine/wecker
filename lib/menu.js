'use strict';

const _ = require('lodash');

const numShow = 4;

const entries = [{
  label: '<- Zurück',
}, {
  label: 'Weckzeiten',
}, {
  label: 'Einstellungen',
}, {
  label: 'Streaming',
}, {
  label: 'Lautstärke',
}, {
  label: 'Morgen',
}];

let active = 0;

const showItems = function() {
  let first;
  let last;

  if(active < numShow) {
    first = 0;
  } else {
    first = active - numShow + 1;
  }

  if(first + numShow <= entries.length) {
    last = first + numShow;
  } else {
    last = entries.length - 1;
    first = last - numShow + 1;
  }

  return {first, last};
};

const display = function() {
  const {first, last} = showItems();

  return {
    active:  active - first,
    entries: _.slice(entries, first, last + 1),
  };
};

const next = function() {
  if(active === entries.length - 1) {
    active = 0;
  } else {
    active++;
  }
};

const previous = function() {
  if(active === 0) {
    active = entries.length - 1;
  } else {
    active--;
  }
};

module.exports = {
  display,
  next,
  previous,
};
