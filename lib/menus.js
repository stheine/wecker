'use strict';

const _        = require('lodash');

const podcasts = require('./podcasts');
const stations = require('./stations');

module.exports = thisLogic => ({
  top: [
//    {
//      label: 'TEST',
//      press: () => {
//        thisLogic.trigger('podcast', 'playFirst', 'Nachrichten');
//      },
//    },
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
      label: 'Podcast',
      press: () => {
        thisLogic.trigger('menu', 'open', 'podcast');
      },
    }, {
      label: 'Sender',
      press: () => {
        thisLogic.trigger('menu', 'open', 'sender');
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
      label: '6:15',
      press: () => {
        thisLogic.trigger('alarm', 'set', '6:15');
      },
    }, {
      label: '6:40',
      press: () => {
        thisLogic.trigger('alarm', 'set', '6:40');
      },
    }, {
      label: '7:00',
      press: () => {
        thisLogic.trigger('alarm', 'set', '7:00');
      },
    }, {
      label: '11:46',
      press: () => {
        thisLogic.trigger('alarm', 'set', '11:46');
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
    {
      label: 'Neueste Nachrichten',
      press: () => {
        thisLogic.trigger('podcast', 'playFirst', 'Nachrichten');
      },
    },
    _.map(_.keys(podcasts), label => ({
      label,
      press: () => {
        thisLogic.trigger('podcast', 'list', label);
      },
    }))),

  'podcastList_<label>': [/* placeholder, dynamic */],
});
