// Every journey record on the site. One object per journey.
//
// status:   "underway" | "completed" | "proposed"      (shown as distinct labels)
// topic:    "education" | "peace" | "faith" | "wellbeing"
// evidence: how we know. Use the same words everywhere:
//   Organiser-reported · Media-reported · Club-reported · Self-reported
//
// A journey with `page: true` gets its own page with up to six chapters:
// reason, road, along, people, followed, record. Leave a chapter out when there
// is nothing sourced to say. Never pad a chapter.

import { applyJourneys } from "../lib/admin-content.mjs";

const PCI_WALK = {
  label: "PCI, Faith in Motion: the walk",
  url: "https://pamodzici.com/walk/",
  kind: "Campaign page",
  note: "Records the 400 km walk as completed on Sunday 2 August 2026.",
};
const PCI_FIM = {
  label: "PCI, Faith in Motion: route records and photographs",
  url: "https://pamodzici.com/faith-in-motion/",
  kind: "Campaign page",
};
const PCI_WFE = {
  label: "PCI, Walk for Education",
  url: "https://pamodzici.com/walk-for-education/",
  kind: "Campaign page",
  note: "The distance and the UGX 25 billion goal are planning figures. No distance completed is published.",
};

const baseJourneys = [
  {
    slug: "walk-for-education",
    page: true,
    title: "Walk for Education",
    years: "2026",
    dateLabel: "2026 · Underway",
    sortKey: 20261101,
    route: "Nairobi, Kenya to UCU–Kagando University College, Uganda",
    topic: "education",
    status: "underway",
    distance: "About 1,100 km",
    distanceBasis: "Planned route (campaign figure). Not distance walked.",
    evidence: "Organiser-reported",
    summary:
      "A walk from Nairobi to UCU–Kagando University College for two linked priorities: the university college and Kagando Nursery & Primary School.",
    hero: {
      image: "portrait",
      alt: "Mbanda Shyaka, smiling, wearing a black headwrap and a grey polo shirt.",
      caption: "Mbanda Shyaka. Photograph supplied for the Walk for Education campaign.",
    },
    chapters: {
      reason: [
        "Walk for Education is a campaign convened by Pamodzi Community Initiative (PCI) Uganda. It brings people together around two linked priorities: UCU–Kagando University College and Kagando Nursery & Primary School.",
        "PCI lists five capital priorities: student hostels; lecture rooms, library and ICT; faculty, staff and campus infrastructure; Kagando Nursery & Primary School; and university expansion.",
        "A five-year mobilisation goal of UGX 25 billion is a target. It is not a statement of money received.",
      ],
      road: [
        "The route runs from Nairobi, Kenya to UCU–Kagando University College in Uganda, about 1,100 km. That is the campaign’s planned route, not a measure of distance walked.",
        "The campaign team has confirmed that the walk is underway. The start date, the towns passed and the kilometres covered will be published here and on PCI’s campaign page once they are confirmed. This site shows no live location.",
      ],
      people: [
        "PCI Uganda is the lead convener and overall coordinator. PCI lists the Diocese of South Rwenzori as an institutional partner.",
      ],
    },
    cta: {
      heading: "Support the current walk",
      text: "Choose your symbolic steps, review your education pledge here and ask the team for the authorised payment instructions.",
      label: "Support this journey",
      url: "/donate/?purpose=education",
    },
    record: {
      sources: [PCI_WFE],
      notes: [
        "Status: the campaign team confirmed on 25 October 2026 that the walk is underway. No dated stage, town or distance covered has been approved for publication yet.",
        "Targets are not totals. The UGX 25 billion five-year goal is what the campaign hopes to mobilise, not what has been received.",
      ],
    },
  },

  {
    slug: "faith-in-motion",
    page: true,
    title: "Faith in Motion",
    years: "2026",
    dateLabel: "Completed 2 August 2026",
    sortKey: 20260802,
    route: "Akright City, Kampala to St Joseph Rwembyo Catholic Church, Kiburara",
    topic: "faith",
    status: "completed",
    distance: "About 400 km",
    distanceBasis: "Reported by PCI as walked in full on 2 August 2026.",
    evidence: "Organiser-reported",
    summary:
      "A walk across Uganda from Akright City in Kampala to Kiburara in the Rwenzori foothills of Kasese, for the completion of St Joseph Rwembyo Catholic Church.",
    hero: {
      image: "river-crossing",
      alt: "Mbanda Shyaka smiling in a selfie on a bridge, with a rocky riverbed and green hills behind him.",
      caption: "A portrait from the road, above a rocky riverbed. Faith in Motion, 2026. Supplied via PCI.",
    },
    chapters: {
      reason: [
        "The walk was for the completion of St Joseph Rwembyo Catholic Church at Kiburara, Kisinga, Kasese District.",
        "PCI’s fundraising for the church continues after the walking leg, toward a published target of UGX 414 million. That figure is a target, not money received.",
      ],
      road: [
        "PCI records that Shyaka walked about 400 km from Akright City in Kampala to Kiburara, in the Rwenzori foothills of Kasese, finishing on Sunday 2 August 2026.",
        "Posts from the road named stages such as Mpigi town, Maddu to Kyayi trading centre, Mabaale to Rwimi and Rwimi to Kasese. This site does not turn those posts into a day-by-day log, because they were written on the road and have not been reconciled.",
      ],
      along: {
        paras: [
          "A still from a video and two route images. The route images carry the distance shown on the day. They are records of single days, not of the whole walk.",
        ],
        figures: [
          {
            image: "evening-road",
            alt: "Shyaka smiling at dusk on a dirt road, with a pale pink sky behind him.",
            caption: "An evening on the road. A still from a video, with the phone’s player bars cropped off.",
          },
          {
            image: "route-mpara-biguli",
            alt: "Shyaka smiling in a selfie. Text over the picture reads Day 8: Mpara–Biguli, and a fitness tracker shows 26.49 km.",
            caption: "Day 8, Mpara to Biguli: 26.49 km as shown by the tracker overlay on the day.",
          },
          {
            image: "route-riverside",
            alt: "Shyaka smiling beside a river, wearing a backpack. A fitness tracker over the picture shows 35.69 km.",
            caption: "Beside a river: 35.69 km as shown by the tracker overlay on the day.",
          },
        ],
      },
      people: {
        paras: [
          "The three photographs below are from the finish at Kiburara on 2 August 2026. They were supplied through PCI.",
        ],
        figures: [
          {
            image: "arrival-celebration",
            alt: "Shyaka smiling in a selfie with four women at the finish in Kiburara. One of them holds a leaflet.",
            caption: "Arrival celebration with supporters.",
          },
          {
            image: "kiburara-procession",
            alt: "Shyaka walking along a dirt road at Kiburara among a crowd of people carrying green branches.",
            caption: "The Kiburara welcome procession.",
          },
          {
            image: "kiburara-crowd",
            alt: "A crowd of adults and children on a road at Kiburara, with Shyaka’s face at the right edge of the frame.",
            caption: "Community welcome at the finish.",
          },
        ],
      },
      followed: [
        "PCI says the walk is complete and the fundraising for the church continues. This site does not show payment details or totals. PCI’s own pages are the place for both.",
      ],
      },
    cta: {
      heading: "Follow the church campaign",
      text: "PCI keeps the official record of the church fundraising, including how to take part.",
      label: "Go to PCI’s Faith in Motion page",
      url: "https://pamodzici.com/faith-in-motion/",
    },
    record: {
      sources: [PCI_WALK, PCI_FIM],
      notes: [
        "About 400 km is PCI’s figure for the completed walk.",
        "About 345 km is an earlier estimate. It appears on the route overlays and on the campaign poster in the gallery. It is the same walk, not a second one, and the two figures are never added together.",
        "UGX 414 million is the published fundraising target. It is not money received.",
      ],
    },
  },

  {
    slug: "peace-walk-nakivale-makerere",
    page: true,
    title: "Peace walk: Nakivale to Makerere",
    years: "2024–2025",
    dateLabel: "27 December 2024 to 11 January 2025",
    sortKey: 20250111,
    route: "Nakivale Refugee Settlement to Makerere University, Kampala",
    topic: "peace",
    status: "completed",
    distance: "300 km",
    distanceBasis: "As reported by Nile Post and Uganda Radio Network.",
    evidence: "Media-reported",
    summary:
      "A 300 km walk for peace that began at the Nakivale refugee settlement and was received at a Rotary peace walk event at Makerere University.",
    chapters: {
      reason: [
        "Nile Post reported the walk as a walk for peace, launched at Nakivale on 27 December 2024.",
      ],
      road: [
        "The launch report gave the distance as 300 km and an intended finish on 10 January.",
        "Uganda Radio Network’s report of 11 January 2025 records his arrival at the Rotary peace walk at Makerere University.",
        "A social post attributed to his account describes a day-five stage from Masaka to Lukaya, 30 km. It has been seen only as a secondary copy, so this site does not use it as evidence.",
      ],
      people: [
        "The headline of Uganda Radio Network’s report says hundreds took part in the Rotary peace walk at Makerere.",
      ],
    },
    record: {
      sources: [
        {
          label: "Nile Post, Walk for peace: Mbanda Shyaka embarks on 300km journey to Makerere University",
          url: "https://nilepost.co.ug/news/234773/walk-for-peace-mbanda-shyaka-embarks-on-300km-journey-to-makerere-university",
          kind: "News report",
          date: "27 December 2024",
        },
        {
          label: "Uganda Radio Network, Hundreds participate in Rotary peace walk",
          url: "https://ugandaradionetwork.net/story/hundreds-participate-in-rotary-peace-walk",
          kind: "News report",
          date: "11 January 2025",
        },
      ],
      notes: [
        "Photographs in those reports belong to the outlets. They are linked, not reproduced here.",
      ],
    },
  },

  {
    slug: "ishekye-sheema-walk",
    page: true,
    title: "Ishekye fundraising walk",
    years: "2024",
    dateLabel: "Flagged off 17 November 2024",
    sortKey: 20241117,
    route: "Akright City, Kampala to Sheema",
    topic: "education",
    status: "completed",
    distance: "Advertised as 310 km",
    distanceBasis: "From the launch report. The club’s later magazine calls it about 300 km.",
    evidence: "Media-reported launch · Club-reported completion",
    summary:
      "A fundraising walk for accessibility improvements for children with disabilities at Ishekye Primary School in Sheema.",
    chapters: {
      reason: [
        "Nile Post reported that the Rotary Club of Akright City flagged off the walk to raise funds for children with disabilities in Sheema, with a focus on accessibility improvements at Ishekye Primary School.",
      ],
      road: [
        "The flag-off was on 17 November 2024 and the walk was advertised as 310 km. The club’s later magazine retrospective describes an approximately 300 km journey from Kampala to Sheema.",
        "This site shows both figures and does not average them.",
      ],
      followed: [
        "The club’s retrospective refers to improvements at Ishekye. It is the club’s own account, not an independent audit, and no final funds total is published here.",
      ],
    },
    record: {
      sources: [
        {
          label: "Nile Post, Rotary Club of Akright City flags off 310km walk to raise funds for disabled kids in Sheema",
          url: "https://nilepost.co.ug/news/227158/rotary-club-of-akright-city-flags-off-310km-walk-to-raise-funds-for-disabled-kids-in-sheema",
          kind: "News report",
          date: "17 November 2024",
        },
        {
          label: "Rotary Club of Akright City magazine, It’s a new dawn (service retrospective)",
          url: "https://rotaryclubakright.com/files/system/RC_Akright_City_Magazine.pdf",
          kind: "Club publication",
          note: "A club account, not an independent audit.",
        },
      ],
      notes: [
        "The fundraising target in the launch report is historical. It is not an audited final collection.",
      ],
    },
  },

  {
    slug: "busia-trek",
    page: true,
    title: "Jinja to Busia and back",
    years: "2024",
    dateLabel: "Completed by April 2024",
    sortKey: 20240401,
    route: "Jinja to Busia and back to Akright City",
    topic: "wellbeing",
    status: "completed",
    distance: "About 370 km over 11 walking days",
    distanceBasis: "Self-reported. No route log has been inspected.",
    evidence: "Self-reported",
    summary:
      "A self-reported walk of about 370 km from Jinja to Busia and back, followed by a mental-health panel on Radio One.",
    chapters: {
      reason: [
        "The Rotary Club of Akright City’s magazine carries a first-person article by Shyaka, “Walking for Mental Health Awareness”, that describes this walk alongside others.",
      ],
      road: [
        "Shyaka reports about 370 km from Jinja to Busia and back to Akright City, over 11 walking days.",
        "An April 2024 LinkedIn post that he wrote describes the completed trek and an appearance on a Radio One Health-net panel.",
        "In a 2025 Daily Monitor feature on the long-distance walker Elitom Elamin, Shyaka describes walking with Elamin from Jinja to Busia.",
      ],
    },
    record: {
      sources: [
        {
          label: "Mbanda Shyaka, LinkedIn post on the 370 km trek and Radio One",
          url: "https://www.linkedin.com/posts/mbanda-shyaka-0313a58a_after-completing-an-arduous-370km-trek-to-activity-7184241472609669120-qRkQ",
          kind: "Self-authored post",
          date: "April 2024",
        },
        {
          label: "Rotary Club of Akright City magazine, “Walking for Mental Health Awareness”",
          url: "https://rotaryclubakright.com/files/system/RCAkright-Magazine.pdf",
          kind: "Club publication (first-person)",
        },
        {
          label: "Daily Monitor, Elamin: the guru who walked 6,700 km to Uganda",
          url: "https://www.monitor.co.ug/uganda/magazines/life/elamin-the-guru-who-walked-6-700-km-to-uganda-5082342",
          kind: "Feature",
          date: "2025",
          note: "Shyaka describes walking with Elamin. Not a route audit.",
        },
      ],
      notes: [
        "Treated as self-reported until a route log or independent report is supplied. Start and end points are not turned into a GPS itinerary.",
        "Wellbeing statements on this site are attributed personal views, not medical advice.",
      ],
    },
  },

  {
    slug: "earlier-walks",
    page: true,
    title: "Earlier walks, 2023 and before",
    years: "2023",
    dateLabel: "2023 and undated",
    sortKey: 20231012,
    route: "Masaka direction · Kisoro to Kabale · a mental-health march",
    topic: "wellbeing",
    status: "completed",
    distance: "Varies",
    distanceBasis: "Each walk is described below with its own source.",
    evidence: "Self-reported · Media-reported",
    summary:
      "The walks that came before the larger campaigns, told only as far as the sources go. Some are undated.",
    hidden: true, // listed in the index as three separate rows instead
    chapters: {},
    items: [
      {
        id: "march-2023",
        title: "Mental-health awareness march",
        dateLabel: "October 2023",
        evidence: "Media-reported",
        text: [
          "POA TV reported Shyaka addressing a mental-health awareness event held by the Rotary Club of Akright City and the Academy for Compassionate Training (ACT).",
          "The report establishes public engagement. It does not establish medical credentials, and this site offers no medical advice.",
        ],
        source: {
          label: "POA TV, Rotary Club of Akright City partners march for mental health awareness",
          url: "https://poatvug.com/rotary-club-of-akright-city-partners-march-for-mental-health-awareness",
          kind: "News report",
          date: "12 October 2023",
        },
      },
      {
        id: "masaka",
        title: "Towards Masaka, and back",
        dateLabel: "2023 (retrospective) · undated (club magazine)",
        evidence: "Self-reported",
        distance: "About 150 km (club magazine)",
        text: [
          "In a February 2025 Daily Monitor interview, Shyaka recalls setting out to meet the long-distance walker Elitom Elamin in the Masaka direction, then walking back towards Kampala and meeting Rotary clubs on the way. He says this helped give him the nickname Walking Rotarian.",
          "In the Rotary Club of Akright City’s magazine, a first-person article describes a 150 km walk from Masaka to Akright City at Bwebajja, with visits to Rotarians and a conversation with students of Uganda Martyrs University at Nkozi. The article is undated.",
          "These two accounts may describe the same journey. This site neither merges nor separates them, and gives no year without the walk log.",
        ],
        source: {
          label: "Daily Monitor, Shyaka: beat fear, obesity and addictions to gain self-mastery",
          url: "https://www.monitor.co.ug/uganda/lifestyle/reviews-profiles/shyaka-beat-fear-obesity-and-addictions-to-gain-self-mastery-4938170",
          kind: "Interview profile",
          date: "23 February 2025",
        },
        source2: {
          label: "Rotary Club of Akright City magazine, “Walking for Mental Health Awareness”",
          url: "https://rotaryclubakright.com/files/system/RCAkright-Magazine.pdf",
          kind: "Club publication (first-person)",
        },
      },
      {
        id: "kisoro-kabale",
        title: "Kisoro to Kabale",
        dateLabel: "Undated (a February)",
        evidence: "Self-reported",
        distance: "Distance not stated",
        text: [
          "The same club article describes a walk from Kisoro to Kabale that ended with a mental-health discussion on Hills FM, 101.7 FM.",
          "The distance, the year and a recording of the broadcast have not been verified.",
        ],
        source: {
          label: "Rotary Club of Akright City magazine, “Walking for Mental Health Awareness”",
          url: "https://rotaryclubakright.com/files/system/RCAkright-Magazine.pdf",
          kind: "Club publication (first-person)",
        },
      },
    ],
    record: { sources: [], notes: [] },
  },

  {
    slug: "dar-es-salaam-proposal",
    page: false,
    title: "Dar es Salaam expedition",
    years: "Proposed",
    dateLabel: "Proposed. No date.",
    sortKey: 1,
    route: "To Dar es Salaam, Tanzania",
    topic: "wellbeing",
    status: "proposed",
    distance: "1,500 km (proposed)",
    distanceBasis: "A figure from the proposal. Nothing has been walked.",
    evidence: "Self-reported",
    summary:
      "A first-person club magazine article describes a future 1,500 km fundraising expedition for a mental-health unit at Kyamulibwa Health Centre IV. It is a proposal only.",
    note: "This is not a completed journey and not a confirmed campaign. No date or route is published.",
    record: {
      sources: [
        {
          label: "Rotary Club of Akright City magazine, “Walking for Mental Health Awareness”",
          url: "https://rotaryclubakright.com/files/system/RCAkright-Magazine.pdf",
          kind: "Club publication (first-person)",
        },
      ],
      notes: [],
    },
  },
];

// Journeys added or updated from the website admin are laid over the list above.
export const journeys = applyJourneys(baseJourneys);

// Rows shown on the journeys index, newest first, proposals last.
// The "earlier walks" page is shown as its own rows (one per item).
export function indexRows() {
  const rows = [];
  for (const j of journeys) {
    if (j.slug === "earlier-walks") {
      for (const it of j.items) {
        rows.push({
          slug: j.slug,
          anchor: it.id,
          page: true,
          title: it.title,
          dateLabel: it.dateLabel,
          route: "",
          topic: "wellbeing",
          status: "completed",
          distance: it.distance || "",
          evidence: it.evidence,
          summary: it.text[0],
          sortKey: it.id === "march-2023" ? 20231012 : it.id === "masaka" ? 20230600 : 20230100,
        });
      }
    } else {
      rows.push(j);
    }
  }
  const rank = (r) => (r.status === "proposed" ? 1 : 0);
  return rows.sort((a, b) => rank(a) - rank(b) || b.sortKey - a.sortKey);
}

export const topicLabels = {
  education: "Education",
  peace: "Peace",
  faith: "Faith",
  wellbeing: "Wellbeing",
};
export const statusLabels = {
  underway: "Underway",
  completed: "Completed",
  proposed: "Proposed",
};
