'use strict';

/* eslint-disable no-underscore-dangle */

const _     = require('lodash');
const check = require('check-types-2');
const dayjs = require('dayjs');

class Menu {
  constructor({entries}) {
    this.lastUse           = dayjs();
    this.activeEntryNumber = entries.length > 1 ? 1 : 0;
    this.entries           = entries;
    this.showEntries       = [];

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
    const activeEntry = this.getActiveEntry();

    if(typeof activeEntry.press === 'function') {
      activeEntry.press();
    }
  }

  next() {
    this.evaluateConditions();

    if(this.activeEntryNumber < this.showEntries.length - 1) {
      this.activeEntryNumber++;
    }

    this.lastUse = dayjs();
  }

  previous() {
    this.evaluateConditions();

    if(this.activeEntryNumber > 0) {
      this.activeEntryNumber--;
    }

    this.lastUse = dayjs();
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

    return this.showEntries[this.getActiveEntryNumber()];
  }

  getActiveEntryNumber() {
    const expire = dayjs().subtract(30, 'minutes');

    if(this.lastUse.isBefore(expire)) {
      this.activeEntryNumber = 1;

      this.lastUse = dayjs();
    }

    this.evaluateConditions();

    return this.activeEntryNumber;
  }

  setActiveEntry(label) {
    this.activeEntryNumber = _.findIndex(this.entries, {label});

    this.lastUse = dayjs();

    if(this.activeEntryNumber === -1) {
      this.activeEntryNumber = 1;
    }
  }
}

module.exports = Menu;
