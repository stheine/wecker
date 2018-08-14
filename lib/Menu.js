'use strict';

/* eslint-disable no-underscore-dangle */

const _ = require('lodash');

const NUM_SHOW = 4;

class Menu {
  constructor({stream}) {
    this.logic       = null;
    this.stream      = stream;

    this._activeEntry = 0;
    this._entries = [{
      label: '<- Zurück',
      press: () => {
        this.logic.display = 'time';
      },
    }, {
      label: 'Weckzeiten',
    }, {
      label: 'Einstellungen',
    }, {
      label: 'Streaming',
      press: () => {
        this.stream.toggle();
      },
    }, {
      label: 'Lautstärke',
    }, {
      label: 'Morgen',
    }];

    this.activeEntry = 0;
    this.entries     = [];

    this.calcEntries();
  }

  calcEntries() {
    let first;
    let last;

    if(this._activeEntry < NUM_SHOW) {
      first = 0;
    } else {
      first = this._activeEntry - NUM_SHOW + 1;
    }

    if(first + NUM_SHOW <= this._entries.length) {
      last = first + NUM_SHOW - 1;
    } else {
      last = this._entries.length - 1;
      first = last - NUM_SHOW + 1;
    }

    this.activeEntry = this._activeEntry - first;
    this.entries     = _.slice(this._entries, first, last + 1);
  }

  press() {
    if(typeof this.entries[this.activeEntry].press === 'function') {
      this.entries[this.activeEntry].press();
    }
  }

  next() {
    if(this._activeEntry === this._entries.length - 1) {
      this._activeEntry = 0;
    } else {
      this._activeEntry++;
    }

    this.calcEntries();
  }

  previous() {
    if(this._activeEntry === 0) {
      this._activeEntry = this._entries.length - 1;
    } else {
      this._activeEntry--;
    }

    this.calcEntries();
  }
}

module.exports = Menu;
