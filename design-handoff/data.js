// Shared mock data for both variations
window.RADIAN_DATA = {
  groups: [
    {
      key: 'status',
      label: 'Status',
      kind: 'status',
      options: [
        { v: 'want',     l: 'Want to try',  dot: '#3b6fb0' },
        { v: 'attempted',l: 'Attempted',    dot: '#a88338' },
        { v: 'done',     l: 'Done',         dot: '#4d8555' },
      ],
    },
    {
      key: 'construction',
      label: 'Construction',
      options: [
        'Compass & straightedge','Ruler only','Freehand',
        'Polygonal method','Grid based','String art / parabolic',
      ],
    },
    {
      key: 'tradition',
      label: 'Tradition',
      options: [
        'Islamic geometric','Moorish-Andalusian','Persian-Iranian',
        'Moroccan-Maghrebi','Ottoman','Gothic-Medieval',
        'Hindu-Vedic','Celtic-Insular','Nature-derived',
        'Syncretic','Contemporary-Mathematical',
      ],
    },
    {
      key: 'pattern',
      label: 'Pattern type',
      options: [
        'Rosette','Star polygon','Tessellation','Arabesque / biomorph',
        'Mandala','Knot / interlace','Spiral','Parabolic curve',
        'Epicycloid','Curve of pursuit','Flower of Life lineage',
      ],
    },
    {
      key: 'symmetry',
      label: 'Symmetry',
      kind: 'symmetry',
      options: ['3','4','5','6','7','8','10','12','16'],
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      kind: 'segmented',
      options: ['Beginner','Intermediate','Advanced'],
    },
  ],

  pieces: [
    { id: 1, title: 'Adam Williamson',      sub: 'Carved rosette · 8-fold',        level: 'Beginner',    status: 'want',      img: 'img/p1.jpg' },
    { id: 2, title: 'Lucie Rose',           sub: 'Painted rondel · 12-fold',       level: 'Beginner',    status: 'want',      img: 'img/p2.jpg' },
    { id: 3, title: 'Interlaced rosette',   sub: 'Stone · 12-fold',                level: 'Intermediate',status: 'attempted', img: 'img/p3.jpg' },
    { id: 4, title: 'Alhambra zellige',     sub: 'Tile · 8-fold',                  level: 'Advanced',    status: 'done',      img: 'img/p4.jpg' },
    { id: 5, title: 'Iznik star polygon',   sub: 'Ceramic · 10-fold',              level: 'Intermediate',status: 'want',      img: 'img/p5.jpg' },
    { id: 6, title: 'Kufic square',         sub: 'Manuscript · 4-fold',            level: 'Beginner',    status: 'done',      img: 'img/p6.jpg' },
  ],

  // Which filters are active by default in the demo
  active: {
    status: [],
    construction: ['Compass & straightedge'],
    tradition: ['Islamic geometric','Moorish-Andalusian'],
    pattern: ['Rosette'],
    symmetry: ['8','12'],
    difficulty: [],
  },
};
