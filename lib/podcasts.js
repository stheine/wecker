'use strict';

/* eslint-disable quote-props */

const moment = require('moment');

module.exports = [
  {
    label:   'Nachrichten',
    url:     'https://www.deutschlandfunk.de/podcast-nachrichten.1257.de.podcast',
    maxAge:  moment.duration(4, 'hours'),
  },
  {
    label:   'Am Morgen',
    url:     'https://www.deutschlandfunk.de/podcast-informationen-am-morgen.782.de.podcast',
    maxAge:  moment.duration(22, 'hours'),
    exclude: /^Sport/,
  },
  {
    label:   'Am Mittag',
    url:     'https://www.deutschlandfunk.de/podcast-informationen-am-mittag-beitraege.788.de.podcast',
    maxAge:  moment.duration(22, 'hours'),
    exclude: /^Sport/,
  },
  {
    label:   'Am Abend',
    url:     'https://www.deutschlandfunk.de/podcast-informationen-am-abend.791.de.podcast',
    maxAge:  moment.duration(22, 'hours'),
    exclude: /^Sport/,
  },
  {
    label:   'Der Tag',
    url:     'https://www.deutschlandfunk.de/podcast-das-war-der-tag.803.de.podcast',
    maxAge:  moment.duration(22, 'hours'),
    exclude: /^Sport/,
  },
];
