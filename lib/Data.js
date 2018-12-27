'use strict';

const path    = require('path');

const _       = require('lodash');
const check   = require('check-types');
const fsExtra = require('fs-extra');

const dataDir = path.join('var', 'wecker');

class Data {
  constructor() {
    // eslint-disable-next-line no-sync
    this.data = fsExtra.readJsonSync(path.join(dataDir, 'data.json'));
  }

  async set(setData) {
    check.assert.object(setData, 'setData is not an object');

    _.merge(this.data, setData);

    await fsExtra.writeJson(path.join(dataDir, 'data.json'), this.data, {spaces: 2});
  }
}

module.exports = Data;
