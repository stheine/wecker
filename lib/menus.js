'use strict';

module.exports = thisLogic => ({
  top: [
    {
      label: '<- Zurück',
      press: () => {
        thisLogic.trigger('menu', 'close');
      },
    }, {
      label: 'Weckzeiten',
      press: () => {
        thisLogic.trigger('menu', 'open', 'weckzeiten');
      },
    }, {
      label: 'Einstellungen',
    }, {
      label: 'Streaming',
      press: () => {
        thisLogic.trigger('stream', 'toggle');
      },
    }, {
      label: 'Lautstärke',
    }, {
      label: 'Morgen',
    },
  ],
  weckzeiten: [
    {
      label: '<- Zurück',
      press: () => {
        thisLogic.trigger('menu', 'close');
      },
    }, {
      label: '2',
    }, {
      label: '3',
    },
  ],
});
