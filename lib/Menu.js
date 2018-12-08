'use strict';

/* eslint-disable no-underscore-dangle */

class Menu {
  constructor({entries}) {
    this.activeEntry = 0;
    this.entries     = entries;
  }

  press() {
    if(typeof this.entries[this.activeEntry].press === 'function') {
      this.entries[this.activeEntry].press();
    }
  }

  next() {
    if(this.activeEntry === this.entries.length - 1) {
      this.activeEntry = 0;
    } else {
      this.activeEntry++;
    }
  }

  previous() {
    if(this.activeEntry === 0) {
      this.activeEntry = this.entries.length - 1;
    } else {
      this.activeEntry--;
    }
  }

  getEntries() {
    return this.entries;
  }

  getEntriesLength() {
    return this.entries.length;
  }

  getEntry(entryNumber) {
    return this.entries[entryNumber];
  }

  getActiveEntry() {
    return this.entries[this.activeEntry];
  }

  getActiveEntryNumber() {
    return this.activeEntry;
  }
}

module.exports = Menu;
