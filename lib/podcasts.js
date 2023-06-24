'use strict';

/* eslint-disable quote-props */

const dayjs = require('dayjs');
const duration = require('dayjs/plugin/duration');

dayjs.extend(duration);

module.exports = [
  {
    label:   'Abend',
    url:     'https://www.deutschlandfunk.de/informationen-am-abend-110.xml',
    maxAge:  dayjs.duration(22, 'hours'),
    exclude: /^(Sport|komplette Sendung)/,
  },
  {
    label:   'Morgen',
    url:     'https://www.deutschlandfunk.de/informationen-am-morgen-102.xml',
    maxAge:  dayjs.duration(22, 'hours'),
    exclude: /^(Sport|komplette Sendung)/,
  },
  {
    label:   'Mittag',
    url:     'https://www.deutschlandfunk.de/informationen-am-mittag-102.xml',
    maxAge:  dayjs.duration(22, 'hours'),
    exclude: /^(Sport|komplette Sendung)/,
  },
  {
    label:   'Tag',
    url:     'https://www.deutschlandfunk.de/das-war-der-tag-112.xml',
    maxAge:  dayjs.duration(22, 'hours'),
    exclude: /^(Sport|komplette Sendung)/,
  },
  {
    label:   'Nachrichten',
    url:     'https://www.deutschlandfunk.de/nachrichten-108.xml',
    maxAge:  dayjs.duration(4, 'hours'),
  },
];
