'use strict';

const _        = require('lodash');

const podcasts = require('./podcasts');
const stations = require('./stations');

const tage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

module.exports = thisLogic => _.assign({
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
      label: 'Wecker',
      press: () => {
        thisLogic.trigger('menu', 'open', 'wecker');
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

  wecker: _.concat([
    {
      label: '<- Zurück',
      press: () => {
        thisLogic.trigger('menu', 'close');
      },
    }],
    _.map(tage, tag => ({
      label:     tag,
      press: () => {
        thisLogic.trigger('menu', 'open', `wecker${tag}`);
      },
    }))),

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
}, _.mapKeys(_.mapValues(tage, tag => _.concat([
  {
    label: '<- Zurück',
    press: () => {
      thisLogic.trigger('menu', 'close');
    },
  }, {
    label:     'Aus',
    condition: () => thisLogic.condition('alarm', 'isSet', tag),
    press:     () => {
      thisLogic.trigger('alarm', 'off', tag);
    },
  }],
  _.map(['6:15', '6:40', '7:00', '7:15', '8:00'], time => ({
    label: time,
    press: () => {
      thisLogic.trigger('alarm', 'set', {day: tag, time});
    },
  })))), (value, key) => `wecker${tage[key]}`));
