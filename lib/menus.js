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
      label: 'Einstellung', // TODO ??? en',
    }, {
      label: 'Streaming',
      press: () => {
        thisLogic.trigger('menu', 'open', 'streaming');
      },
    }, {
      label: 'Lautstärke',
    }, {
      label: 'Morgen',
    },
  ],

  weckzeiten: [ // TODO
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

  streaming: [
    {
      label: '<- Zurück',
      press: () => {
        thisLogic.trigger('menu', 'close');
      },
    }, {
      label: 'An/Aus',
      press: () => {
        thisLogic.trigger('stream', 'toggle');
      },
    }, {
      label: 'Sender',
      press: () => {
        thisLogic.trigger('menu', 'open', 'sender');
      },
    },
  ],

  sender: [
    {
      label: '<- Zurück',
      press: () => {
        thisLogic.trigger('menu', 'close');
      },
    }, {
      label: 'DLF',
      press: () => {
        thisLogic.trigger('stream', 'set', 'DLF');
      },
    }, {
      label: 'DLF Kultur',
      press: () => {
        thisLogic.trigger('stream', 'set', 'DLF Kultur');
      },
    }, {
      label: 'DLF Nova',
      press: () => {
        thisLogic.trigger('stream', 'set', 'DLF Nova');
      },
    }, {
      label: 'Burn FM',
      press: () => {
        thisLogic.trigger('stream', 'set', 'Burn FM');
      },
    }, {
      label: 'SWR3',
      press: () => {
        thisLogic.trigger('stream', 'set', 'SWR3');
      },
    }, {
      label: 'SWR3 Rock',
      press: () => {
        thisLogic.trigger('stream', 'set', 'SWR3 Rock');
      },
    },
  ],
});
