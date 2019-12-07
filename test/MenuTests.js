'use strict';

const _      = require('lodash');
const assert = require('assertthat').default;

const Menu = require('../lib/Menu');

let pressed   = null;
let showThree = true;

const entries = [
  {
    label: 'one',
    press: () => {
      pressed = 'one';
    },
  },
  {
    label: 'two',
    press: () => {
      pressed = 'two';
    },
  },
  {
    label:     'three - conditional',
    condition: () => showThree,
  },
  {
    label: 'four',
  },
  {
    label: 'five',
  },
  {
    label: 'six',
  },
];

suite('Menu', () => {
  test('is a function', async() => {
    assert.that(Menu).is.ofType('function');
  });

  suite('menu', () => {
    test('init', async() => {
      const menu = new Menu({entries});

      assert.that(menu).is.ofType('object');
      assert.that(menu.getEntry(0).label).is.equalTo('one');
      assert.that(menu.getActiveEntryNumber()).is.equalTo(0);
      assert.that(menu.getActiveEntry().label).is.equalTo('one');
    });

    test('getEntries()', async() => {
      const menu = new Menu({entries});

      const gotEntries = menu.getEntries();

      assert.that(gotEntries).is.ofType('array');
      assert.that(gotEntries.length).is.equalTo(6);
      assert.that(_.first(gotEntries).label).is.equalTo('one');
    });

    test('getEntriesLength()', async() => {
      const menu = new Menu({entries});

      assert.that(menu.getEntriesLength()).is.equalTo(6);
    });

    test('next()', async() => {
      const menu = new Menu({entries});

      menu.next();

      assert.that(menu.getEntry(0).label).is.equalTo('one');
      assert.that(menu.getActiveEntryNumber()).is.equalTo(1);
      assert.that(menu.getActiveEntry().label).is.equalTo('two');
    });

    test('5 * next()', async() => {
      const menu = new Menu({entries});

      _.times(5, () => menu.next());

      assert.that(menu.getActiveEntryNumber()).is.equalTo(5);
      assert.that(menu.getActiveEntry().label).is.equalTo('six');
    });

    test('6 * next()', async() => {
      const menu = new Menu({entries});

      _.times(6, () => menu.next());

      assert.that(menu.getActiveEntryNumber()).is.equalTo(0);
      assert.that(menu.getActiveEntry().label).is.equalTo('one');
    });

    test('previous()', async() => {
      const menu = new Menu({entries});

      menu.previous();

      assert.that(menu.getActiveEntryNumber()).is.equalTo(5);
      assert.that(menu.getActiveEntry().label).is.equalTo('six');
    });

    test('5 * previous()', async() => {
      const menu = new Menu({entries});

      _.times(5, () => menu.previous());

      assert.that(menu.getActiveEntryNumber()).is.equalTo(1);
      assert.that(menu.getActiveEntry().label).is.equalTo('two');
    });

    test('6 * previous()', async() => {
      const menu = new Menu({entries});

      _.times(6, () => menu.previous());

      assert.that(menu.getActiveEntryNumber()).is.equalTo(0);
      assert.that(menu.getActiveEntry().label).is.equalTo('one');
    });

    test('press()', async() => {
      const menu = new Menu({entries});

      assert.that(pressed).is.null();

      menu.press();

      assert.that(pressed).is.equalTo('one');

      menu.next();
      menu.press();

      assert.that(pressed).is.equalTo('two');
    });

    suite('condition', () => {
      test('getEntriesLength()', async() => {
        const menu = new Menu({entries});

        assert.that(menu.getEntriesLength()).is.equalTo(6);
        showThree = false;
        assert.that(menu.getEntriesLength()).is.equalTo(5);
      });

      test('change visibility', async() => {
        const menu = new Menu({entries});

        showThree = false;

        menu.next();
        assert.that(menu.getActiveEntry().label).is.equalTo('two');

        menu.next();
        assert.that(menu.getActiveEntry().label).is.equalTo('four');

        showThree = true;

        menu.previous();
        assert.that(menu.getActiveEntry().label).is.equalTo('two');

        menu.next();
        assert.that(menu.getActiveEntry().label).is.equalTo('three - conditional');
      });

      test(`on item that's switched to invisible`, async() => {
        const menu = new Menu({entries});

        showThree = true;

        menu.next();
        menu.next();
        assert.that(menu.getActiveEntry().label).is.equalTo('three - conditional');

        showThree = false;
        menu.refresh();
        assert.that(menu.getActiveEntry().label).is.equalTo('four');
      });
    });
  });
});
