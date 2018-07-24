'use strict';

/* eslint-disable no-underscore-dangle */

const _ = require('lodash');

const NUM_SHOW = 4;

class Menu {
  constructor({stream}) {
    this.stream      = stream;

    this.isActive    = false;
    this.activeEntry = 0;
    this.entries     = [];

    this._activeEntry = 0;
    this._entries = [{
      label: '<- Zurück',
      press: () => {
        this.isActive = false;
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
  }

  showItems() {
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

    return {first, last};
  }

  display() {
    const {first, last} = this.showItems();

    this.activeEntry = this._activeEntry - first;
    this.entries     = _.slice(this._entries, first, last + 1);
  }

  next() {
    if(this._activeEntry === this._entries.length - 1) {
      this._activeEntry = 0;
    } else {
      this._activeEntry++;
    }
  }

  previous() {
    if(this._activeEntry === 0) {
      this._activeEntry = this._entries.length - 1;
    } else {
      this._activeEntry--;
    }
  }
}

module.exports = Menu;
