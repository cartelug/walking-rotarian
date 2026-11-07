const scenes = [
  ['campaign-hero', 'Every step has a story', 'Mbanda walking along a green hillside road in soft morning light.', 'A promotional walking scene created from the supplied portraits and walking photographs.'],
  ['campaign-journal', 'A pause along the way', 'Mbanda looking along a quiet red-earth road beneath roadside trees.', 'An imagined moment of reflection for the live journal.'],
  ['campaign-community', 'Walking together', 'Mbanda sharing a laugh with three illustrative adult walking companions.', 'A generated community scene. The accompanying figures are illustrative characters.'],
  ['campaign-portrait', 'Room to reflect', 'A generated portrait of Mbanda seated beside a footpath with a small notebook.', 'A campaign portrait inspired by Mbanda’s supplied photographs.'],
  ['campaign-highlands', 'Into the highlands', 'Layers of green East African hills, morning mist and a winding footpath.', 'Evocative highland landscape artwork.'],
  ['campaign-learning', 'A journey toward learning', 'Exercise books, a notebook and a walking backpack beside an open window.', 'A conceptual still life connecting walking and education.'],
  ['campaign-riverside', 'By the water', 'A generated portrait of Mbanda beside a rocky river and footbridge.', 'A riverside campaign scene inspired by the supplied Faith in Motion photographs.'],
  ['campaign-evening', 'The road ahead', 'A lone walker following a red-earth road into the evening light.', 'An imagined evening walk across an East African landscape.'],
  ['campaign-footsteps', 'One step at a time', 'Worn walking boots taking a step on a sunlit red-earth path.', 'A conceptual detail of movement and perseverance.'],
  ['campaign-essentials', 'Companions for the road', 'A cap, T-shirt, bottle, canvas backpack and book on a natural stone ledge.', 'Product concept artwork. Actual designs and availability are confirmed by the shop team.'],
  ['campaign-forest', 'A quieter path', 'A narrow path through deep green forest with soft shafts of morning light.', 'An imagined forest landscape for the journey archive.'],
  ['campaign-open-road', 'An open horizon', 'Mbanda walking beside open grassland and scattered trees beneath a broad sky.', 'A promotional walking scene inspired by the supplied photographs.'],
];

export const campaignArtwork = scenes.map(([id, title, alt, caption]) => ({
  id, image: id, title,
  alt: 'Campaign artwork. ' + alt,
  caption: caption + ' Created with AI for this website.',
  group: 'artwork', kind: 'AI-generated campaign artwork', filters: ['artwork'],
  source: 'PCI documentary archive and project-owner supplied reference photographs',
  credit: 'Walking Rotarian campaign artwork',
  date: 'Created 7 November 2026', journey: '',
  permission: 'Created at the project owner’s request', focal: '50% 50%',
}));
