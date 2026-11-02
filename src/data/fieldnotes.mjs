// Field notes: dated, sourced, third-person records. Newest first.
//
// To add a note for the current walk: copy an entry, give it a real date, a
// place, one or two sentences that the source supports, and the source link.
// Never write in Shyaka's voice unless he wrote the words himself, and then
// quote his own post and link it.

export const pinned = {
  heading: "On the road now: Walk for Education",
  text: "The campaign team has confirmed that the walk is underway. Stage updates will appear here once they are confirmed with a date, a place and a source.",
  lastVerified: null, // set from currentWalk.lastVerifiedUpdate in the build
};

export const notes = [
  {
    id: "kiburara-2026",
    date: "2026-08-02",
    dateLabel: "2 August 2026",
    place: "Kiburara, Kasese District",
    title: "Faith in Motion reaches Kiburara",
    text: [
      "PCI records that Shyaka completed the 400 km walk from Akright City in Kampala to St Joseph Rwembyo Catholic Church at Kiburara on Sunday 2 August 2026.",
      "Photographs from the finish show a welcome procession and a crowd along the road.",
    ],
    journey: "faith-in-motion",
    evidence: "Organiser-reported",
    source: { label: "PCI, Faith in Motion: the walk", url: "https://pamodzici.com/walk/" },
    image: {
      image: "kiburara-procession",
      alt: "Shyaka walking along a dirt road at Kiburara among a crowd of people carrying green branches.",
      caption: "The welcome procession at Kiburara. Supplied via PCI.",
    },
  },
  {
    id: "makerere-2025",
    date: "2025-01-11",
    dateLabel: "11 January 2025",
    place: "Makerere University, Kampala",
    title: "The peace walk reaches Makerere",
    text: [
      "Uganda Radio Network reported Shyaka’s arrival at the Rotary peace walk at Makerere University, at the end of the 300 km walk from Nakivale. Its headline says hundreds took part. The report spells his name Shaka Mbanda.",
    ],
    journey: "peace-walk-nakivale-makerere",
    evidence: "Media-reported",
    source: {
      label: "Uganda Radio Network, Hundreds participate in Rotary peace walk",
      url: "https://ugandaradionetwork.net/story/hundreds-participate-in-rotary-peace-walk",
    },
  },
  {
    id: "nakivale-2024",
    date: "2024-12-27",
    dateLabel: "27 December 2024",
    place: "Nakivale Refugee Settlement",
    title: "The peace walk leaves Nakivale",
    text: [
      "Nile Post reported the launch of a 300 km walk for peace from Nakivale to Makerere University, with an intended finish on 10 January.",
    ],
    journey: "peace-walk-nakivale-makerere",
    evidence: "Media-reported",
    source: {
      label: "Nile Post, Walk for peace: Mbanda Shyaka embarks on 300km journey to Makerere University",
      url: "https://nilepost.co.ug/news/234773/walk-for-peace-mbanda-shyaka-embarks-on-300km-journey-to-makerere-university",
    },
  },
  {
    id: "ishekye-2024",
    date: "2024-11-17",
    dateLabel: "17 November 2024",
    place: "Akright City, Kampala",
    title: "The Ishekye fundraising walk is flagged off",
    text: [
      "Nile Post reported that the Rotary Club of Akright City flagged off a walk, advertised as 310 km, to raise funds for children with disabilities in Sheema, with accessibility improvements at Ishekye Primary School as the aim.",
    ],
    journey: "ishekye-sheema-walk",
    evidence: "Media-reported",
    source: {
      label: "Nile Post, Rotary Club of Akright City flags off 310km walk",
      url: "https://nilepost.co.ug/news/227158/rotary-club-of-akright-city-flags-off-310km-walk-to-raise-funds-for-disabled-kids-in-sheema",
    },
  },
  {
    id: "busia-2024",
    date: "2024-04-11",
    dateLabel: "11 April 2024",
    place: "Jinja to Busia and back",
    title: "A 370 km trek, reported by Shyaka",
    text: [
      "In a LinkedIn post, Shyaka describes having completed an arduous trek of about 370 km and an appearance on a Radio One Health-net mental-health panel. This is his own account.",
    ],
    journey: "busia-trek",
    evidence: "Self-reported",
    source: {
      label: "Mbanda Shyaka on LinkedIn",
      url: "https://www.linkedin.com/posts/mbanda-shyaka-0313a58a_after-completing-an-arduous-370km-trek-to-activity-7184241472609669120-qRkQ",
    },
  },
  {
    id: "mh-2023",
    date: "2023-10-12",
    dateLabel: "12 October 2023",
    place: "Rotary Club of Akright City event",
    title: "A mental-health awareness event",
    text: [
      "POA TV reported Shyaka addressing an event on mental-health awareness held by the Rotary Club of Akright City and the Academy for Compassionate Training.",
    ],
    journey: "earlier-walks",
    anchor: "march-2023",
    evidence: "Media-reported",
    source: {
      label: "POA TV, Rotary Club of Akright City partners march for mental health awareness",
      url: "https://poatvug.com/rotary-club-of-akright-city-partners-march-for-mental-health-awareness",
    },
  },
  {
    id: "tedx-2023",
    date: "2023-07-31",
    dateLabel: "31 July 2023",
    place: "TEDxLubowa",
    title: "A TEDx talk is published",
    text: [
      "TEDx Talks published “From Unhealthy to Unstoppable: A Journey of Transformation”, Shyaka’s TEDxLubowa talk. TEDx’s upload carries a caution about health claims in the talk. It is a personal story, not medical advice.",
    ],
    evidence: "Official TEDx upload",
    source: { label: "TEDx Talks on YouTube", url: "https://www.youtube.com/watch?v=7tLq6c_CHG8" },
  },
];
