'use strict';

/* eslint-disable no-underscore-dangle */

const check = require('check-types');

class Menu {
  constructor({entries}) {
    this.activeEntry = 0;
    this.entries     = entries;
    this.showEntries = [];

    this.evaluateConditions();
  }

  evaluateConditions() {
    const showEntries = [];

    for(const entry of this.entries) {
      if(entry.condition) {
        check.assert.function(entry.condition, `condition is not a function in ${entry.label}`);

        if(entry.condition()) {
          showEntries.push(entry);
        }
      } else {
        showEntries.push(entry);
      }
    }

    this.showEntries = showEntries;
  }

  refresh() {
    this.evaluateConditions();
  }

  press() {
    if(typeof this.showEntries[this.activeEntry].press === 'function') {
      this.showEntries[this.activeEntry].press();
    }
  }

  next() {
    this.evaluateConditions();

    if(this.activeEntry === this.showEntries.length - 1) {
      this.activeEntry = 0;
    } else {
      this.activeEntry++;
    }
  }

  previous() {
    this.evaluateConditions();

    if(this.activeEntry === 0) {
      this.activeEntry = this.showEntries.length - 1;
    } else {
      this.activeEntry--;
    }
  }

  getEntries() {
    this.evaluateConditions();

    return this.showEntries;
  }

  getEntriesLength() {
    this.evaluateConditions();

    return this.showEntries.length;
  }

  getEntry(entryNumber) {
    this.evaluateConditions();

    return this.showEntries[entryNumber];
  }

  getActiveEntry() {
    this.evaluateConditions();

    return this.showEntries[this.activeEntry];
  }

  getActiveEntryNumber() {
    this.evaluateConditions();

    return this.activeEntry;
  }
}

module.exports = Menu;
