import path    from 'path';

import _       from 'lodash';
import check   from 'check-types-2';
import fsExtra from 'fs-extra';

const dataDir  = path.join('/', 'var', 'wecker');
const dataFile = path.join(dataDir, 'data.json');

class Data {
  constructor() {
    // eslint-disable-next-line no-sync
    fsExtra.ensureFileSync(dataFile);

    // eslint-disable-next-line no-sync
    this.data = fsExtra.readJsonSync(dataFile, {throws: false}) || {};
  }

  async set(setData) {
    check.assert.object(setData, 'setData is not an object');

    _.merge(this.data, setData);

    await fsExtra.writeJson(dataFile, this.data, {spaces: 2});
  }
}

export default Data;
