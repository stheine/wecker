'use strict';

/* eslint-disable quote-props */

const dayjs = require('dayjs');
const duration = require('dayjs/plugin/duration');

dayjs.extend(duration);

module.exports = [
  {
    label:   'Abend',
    url:     'https://www.deutschlandfunk.de/podcast-informationen-am-abend.791.de.podcast',
    maxAge:  dayjs.duration(22, 'hours'),
    exclude: /^Sport/,
  },
  {
    label:   'Morgen',
    url:     'https://www.deutschlandfunk.de/podcast-informationen-am-morgen.782.de.podcast',
    maxAge:  dayjs.duration(22, 'hours'),
    exclude: /^Sport/,
  },
  {
    label:   'Mittag',
    url:     'https://www.deutschlandfunk.de/podcast-informationen-am-mittag-beitraege.788.de.podcast',
    maxAge:  dayjs.duration(22, 'hours'),
    exclude: /^Sport/,
  },
  {
    label:   'Tag',
    url:     'https://www.deutschlandfunk.de/podcast-das-war-der-tag.803.de.podcast',
    maxAge:  dayjs.duration(22, 'hours'),
    exclude: /^Sport/,
  },
  {
    label:   'Nachrichten',
    url:     'https://www.deutschlandfunk.de/podcast-nachrichten.1257.de.podcast',
    maxAge:  dayjs.duration(4, 'hours'),
  },
];
