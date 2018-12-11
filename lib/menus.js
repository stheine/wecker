'use strict';

const _        = require('lodash');

const podcasts = require('./podcasts');
const stations = require('./stations');

module.exports = thisLogic => ({
  top: [
//    {
//      label: 'TEST',
//      press: () => {
//        thisLogic.trigger('podcast', 'list', 'Am Abend');
//      },
//    },
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
        thisLogic.trigger('stream', 'play', label);
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
