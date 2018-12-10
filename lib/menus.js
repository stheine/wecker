'use strict';

const _        = require('lodash');

const stations = require('./stations');

module.exports = thisLogic => {
  const sender = _.map(_.keys(stations), label => ({
    label,
    press: () => {
      thisLogic.trigger('stream', 'set', label);
    },
  }));

  return {
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

    sender: _.concat([
      {
        label: '<- Zurück',
        press: () => {
          thisLogic.trigger('menu', 'close');
        },
      }],
      sender),
  };
};
