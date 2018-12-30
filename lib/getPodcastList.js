#!/usr/bin/env node

'use strict';

/* eslint-disable no-underscore-dangle */

const _       = require('lodash');
const request = require('request-promise-native');
const xmlJs   = require('xml-js');

const url = process.argv[2];

(async() => {
  const xml = await request.get(url);
  const rss = xmlJs.xml2js(xml, {compact: true});
  const items = _.slice(rss.rss.channel.item, 0, 10);
  let   getLabel = item => item.title._text;

  if(getLabel(items[0]) === getLabel(items[1])) {
    getLabel = item => item.pubDate._text
    .replace(/^\w+, \d+ \w+ \d+ /, '')
    .replace(/:\d+ \+\d+$/, '');
  }

  process.send({podcastList: _.map(items, item => _.assign(item, {
    podcastLabel: getLabel(item),
  }))});
})();
