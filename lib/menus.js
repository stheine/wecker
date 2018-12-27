'use strict';

const _        = require('lodash');

const podcasts = require('./podcasts');
const stations = require('./stations');

module.exports = thisLogic => ({
  top: [
//    {
//      label: 'TEST',
//      press: () => {
//        thisLogic.trigger('podcast', 'list', 'Am Mittag');
//      },
//    },
    {
      label: '<- Zurück',
      press: () => {
        thisLogic.trigger('menu', 'close');
      },
    }, {
      label: 'Streaming',
      press: () => {
        thisLogic.trigger('menu', 'open', 'streaming');
      },
    }, {
      label: 'Weckzeiten',
      press: () => {
        thisLogic.trigger('menu', 'open', 'weckzeiten');
      },
    }, {
      label: 'Einstellung', // TODO ??? en',
      press: () => {
        thisLogic.trigger('menu', 'open', 'einstellungen');
      },
    },
  ],

  einstellungen: [
    {
      label: '<- Zurück',
      press: () => {
        thisLogic.trigger('menu', 'close');
      },
    }, {
      label:     'Helligkeit',
      press:     () => {
        thisLogic.trigger('set', 'dim');
      },
    },
  ],

  weckzeiten: [ // TODO
    {
      label: '<- Zurück',
      press: () => {
        thisLogic.trigger('menu', 'close');
      },
    }, {
      label:     'Aus',
      condition: () => thisLogic.condition('alarm', 'isSet'),
      press:     () => {
        thisLogic.trigger('alarm', 'off');
      },
    }, {
      label: 'Set',
      press: () => {
        thisLogic.trigger('alarm', 'set');
      },
    },
  ],

  streaming: [
    {
      label: '<- Zurück',
      press: () => {
        thisLogic.trigger('menu', 'close');
      },
    }, {
      label:     'Aus',
      condition: () => thisLogic.condition('stream', 'isPlaying'),
      press:     () => {
        thisLogic.trigger('stream', 'stop');
      },
    }, {
      label: 'Sender',
      press: () => {
        thisLogic.trigger('menu', 'open', 'sender');
      },
    }, {
      label: 'Podcast',
      press: () => {
        thisLogic.trigger('menu', 'open', 'podcast');
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
    _.map(_.keys(stations), label => ({
      label,
      press: () => {
        thisLogic.trigger('stream', 'playStation', label);
      },
    }))),

  podcast: _.concat([
    {
      label: '<- Zurück',
      press: () => {
        thisLogic.trigger('menu', 'close');
      },
    }],
    _.map(_.keys(podcasts), label => ({
      label,
      press: () => {
        thisLogic.trigger('podcast', 'list', label);
      },
    }))),

  podcastList: [/* placeholder, dynamic */],
});
