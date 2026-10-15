// Version anglaise des articles écrits à partir des recherches (voir articles-recherches.ts).
// Même ordre de sections que la version française.

import type { ArticleEn } from "@/lib/articles-en";

export const ARTICLES_RECHERCHES_EN: Record<string, ArticleEn> = {
  "voyant-check-engine-allume": {
    title: "Check engine light on: what to do? (steady or flashing)",
    excerpt: "Orange engine light on or flashing: what it means, when to stop right away and how to find the cause without getting taken for a ride.",
    sections: [
      { heading: "What the check engine light means", content: "The engine light (often called \"check engine\") comes on when the vehicle's computer detects a problem with the engine, ignition, fuel injection or emissions system. It doesn't say what the problem is: it signals that an error code has been stored." },
      {
        heading: "Steady or flashing: the big difference", content: "The colour and behaviour of the light tell you how urgent it is.",
        tips: [
          "Steady orange light: a problem to have checked in the next few days, not an emergency if the car drives normally",
          "Flashing light: often a serious misfire; slow down and have it checked the same day",
          "Light with loss of power, smoke or an unusual noise: stop in a safe place",
        ],
        warning: "Don't ignore a flashing light: driving on can damage the catalytic converter, an expensive repair.",
      },
      {
        heading: "The most common causes", content: "Many check engine lights have a simple cause, but only reading the code tells you which one.",
        tips: [
          "Gas cap not closed properly after filling up",
          "Faulty oxygen sensor or mass airflow sensor",
          "Worn spark plugs or ignition coils (misfires)",
          "Leak in the fuel vapour recovery system",
          "Clogged or failing catalytic converter",
        ],
      },
      { heading: "What to do", content: "First check the gas cap and tighten it. If the light stays on after a few trips, have the error code read with an OBD-II reader, then have the problem diagnosed by a garage. The code gives a lead, not always the part to replace: a proper diagnosis avoids replacing parts at random.", note: "Before a repair over $100, the garage must give you a written estimate (Quebec Consumer Protection Act)." },
    ],
  },
  "voiture-ne-demarre-pas": {
    title: "Car won't start: causes and what to do (clicking, no sound, battery OK)",
    excerpt: "One click, several clicks, no sound or an engine that cranks but won't start: each symptom points to a different cause. Here's how to tell.",
    sections: [
      {
        heading: "Listen to what happens when you turn the key", content: "The sound (or lack of sound) when you start is the best clue to the cause.",
        tips: [
          "Rapid click-click-click and dim dashboard: battery too weak, the most common case in winter",
          "A single click, normal dashboard: starter, or a loose or corroded battery connection",
          "No sound and dark dashboard: completely dead battery or disconnected terminal",
          "The engine cranks but won't start: fuel, ignition or immobilizer problem",
        ],
      },
      {
        heading: "Battery OK but the car won't start", content: "A new battery, or one that charges fine, doesn't rule everything out. Corroded terminals block the current, a worn starter can refuse to turn, and the key or fob may no longer be recognized by the immobilizer (weak battery).",
        tips: [
          "Check that the terminals are clean and tight",
          "Try the spare key if the immobilizer light is flashing",
          "With an automatic transmission, check that the lever is in \"P\"",
        ],
      },
      { heading: "Quebec cold, the battery's enemy", content: "In extreme cold, a battery loses much of its power while the engine, with thickened oil, needs more effort to turn. A battery over 4 or 5 years old that struggles to start in the fall is likely to give out in the first deep freeze." },
      { heading: "What to do", content: "A boost often gets you going if the battery is the cause. If the car restarts but the problem comes back, have the battery and alternator tested: an alternator that no longer charges drains a new battery in a few days.", warning: "If you smell gasoline or see smoke, don't keep cranking: have the vehicle towed." },
    ],
  },
  "inspection-pre-achat-voiture-usagee": {
    title: "Pre-purchase inspection of a used car: why and what to check",
    excerpt: "Before buying a used car in Quebec: what a pre-purchase inspection covers, the documents to ask for and SAAQ rules for a vehicle from another province.",
    sections: [
      { heading: "Why have a car inspected before buying it", content: "A used car can hide structural rust, worn brakes, a leak or a transmission problem that a test drive won't reveal. A pre-purchase inspection by an independent garage gives you the list of repairs to expect: something to negotiate the price with, or a reason to walk away in time." },
      {
        heading: "What a pre-purchase inspection checks", content: "The content varies from one garage to another; ask for the checklist before booking.",
        tips: [
          "Frame and underbody: rust, welds, signs of an accident",
          "Brakes, suspension, steering and tires (even wear or not)",
          "Oil, coolant or transmission fluid leaks",
          "Reading the on-board computer's error codes",
          "Road test: noises, vibrations, gear changes",
        ],
      },
      {
        heading: "Documents to check", content: "Mechanical condition isn't enough: also check the vehicle's legal status.",
        tips: [
          "The registration certificate, in the seller's name",
          "The Register of personal and movable real rights (RDPRM), to make sure no loan is attached to the vehicle",
          "The maintenance history and repair invoices",
          "Outstanding manufacturer recalls",
        ],
      },
      { heading: "Vehicle from another province", content: "According to the SAAQ, a used vehicle from outside Quebec must undergo a mechanical inspection before it can be registered. The same applies to a severely damaged vehicle that has been rebuilt, or one stored for more than 12 months. Check before buying: the inspection and any required repairs belong in your budget." },
      { heading: "Book an inspection", content: "Choose a garage with no connection to the seller, and allow an hour to an hour and a half. On Garago, you can find a garage offering pre-purchase inspections near the vehicle and book online." },
    ],
  },
  "pneus-4-saisons-legal-quebec": {
    title: "All-season tires: are they legal in winter in Quebec?",
    excerpt: "From December 1 to March 15, tires must bear the mountain and snowflake pictogram. All-season tires with it are allowed; others are not. The rules, clearly.",
    sections: [
      { heading: "The rule: the mountain and snowflake pictogram", content: "In Quebec, from December 1 to March 15 inclusive, passenger vehicles registered in Quebec must run on tires designed for winter. A tire counts as a winter tire if it bears the pictogram of a snowflake inside a mountain, or if it is studded." },
      {
        heading: "Four-season vs all-season tires: the difference", content: "The pictogram makes all the difference.",
        tips: [
          "Four-season tire with the mountain and snowflake pictogram: allowed in winter",
          "\"All-season\" tire marked only M+S: not compliant from December 1 to March 15",
          "Check the sidewall: the pictogram is moulded into it",
        ],
        note: "An approved four-season tire is still a compromise: on ice and deep snow, a true winter tire keeps an edge. It does save two tire changes a year.",
      },
      { heading: "Other rules to know", content: "The requirement covers all passenger vehicles registered in Quebec, including rentals. Studded tires are allowed from October 15 to May 1. Driving without compliant tires during the mandatory period carries a fine of $200 to $300, plus costs." },
      { heading: "The right time to install them", content: "Don't wait until November 30: garages are swamped at the first snowfall. Install your winter tires when the temperature stays around 7 °C, often by late October, and book your appointment a few weeks ahead." },
    ],
  },
  "usure-pneus-quand-changer": {
    title: "Tire wear: when should you replace your tires?",
    excerpt: "Minimum depth, wear bars, inside wear or cupping: how to read your tires' wear and know when to replace them.",
    sections: [
      {
        heading: "Minimum tread depth", content: "A tire whose tread drops below 1.6 mm (2/32 inch) is worn out and must be replaced. Wear bars, small bars moulded at the bottom of the grooves, become level with the tread at that depth. For a winter tire, don't wait for that threshold: below about 4 mm it clears snow and slush poorly.",
        tips: [
          "Measure with a tread depth gauge, sold for a few dollars",
          "Measure in several places: the centre and both edges",
          "Think about age too: a tire hardens over the years, even with little wear",
        ],
      },
      {
        heading: "What uneven wear tells you", content: "The way a tire wears often reveals another problem to fix, or new tires will wear the same way.",
        tips: [
          "Worn on the inside or outside edge: alignment problem",
          "Worn in the centre: overinflated tires",
          "Worn on both edges: underinflated tires",
          "Cupping (scalloped wear): tired shocks or alignment to check",
        ],
      },
      { heading: "Making tires last", content: "Check the pressure once a month, cold, according to the sticker on the driver's door. Rotate tires according to the manufacturer's recommendations, and have the alignment checked after hitting a pothole or a curb." },
      { heading: "When to go to the garage", content: "Use the seasonal change: the garage can measure tread depth, spot uneven wear and check alignment while mounting your tires." },
    ],
  },
  "verification-mecanique-saaq": {
    title: "SAAQ mechanical inspection: when is it mandatory?",
    excerpt: "Vehicle from another province, rebuilt, stored for over 12 months, taxi, driving school… The cases where the SAAQ requires a mechanical inspection, and how to prepare.",
    sections: [
      { heading: "No mandatory inspection for an ordinary car", content: "In Quebec, a passenger car used normally has no mandatory periodic mechanical inspection. The SAAQ only requires one in specific cases, before putting the vehicle back on the road or at regular intervals depending on its use." },
      {
        heading: "Before putting a vehicle on the road", content: "According to the SAAQ, a mechanical inspection is required in particular for:",
        tips: [
          "A used vehicle from outside Quebec",
          "A severely damaged vehicle that has been rebuilt",
          "A vehicle stored or not authorized to be driven for more than 12 months",
          "A hand-crafted or modified vehicle",
          "A vehicle deemed dangerous by the SAAQ or a peace officer",
        ],
      },
      { heading: "Periodic inspections based on use", content: "Some vehicles are inspected every 6 or 12 months: driving school vehicles, school transport, paid passenger transport vehicles depending on their age, emergency vehicles and heavy vehicles. The detailed rules are published by the SAAQ." },
      { heading: "Preparing for the inspection", content: "The inspection is done at a mechanical inspection centre or an SAAQ-authorized agent. To avoid failing, have your garage inspect the vehicle first: brakes, lights, tires, steering, suspension and windshield are commonly checked." },
    ],
  },
  "garantie-reparation-automobile-quebec": {
    title: "Car repair warranty in Quebec: your rights",
    excerpt: "Written estimate required over $100, 3-month or 5,000 km warranty, maximum price: what Quebec's Consumer Protection Act guarantees you at the garage.",
    sections: [
      {
        heading: "The written estimate before the work", content: "According to the Office de la protection du consommateur, for a repair over $100 the garage must give you a written estimate before starting. You can only waive it in a document you write and sign yourself: a pre-printed form has no value.",
        tips: [
          "Your name and address, and the garage's",
          "A description of the vehicle",
          "The nature and total price of the repair",
          "The parts to be installed: new, used, remanufactured or rebuilt",
          "The date and validity period of the estimate",
        ],
      },
      { heading: "A price that can't go up", content: "The garage can't charge you more than the estimate total, except for additional work you authorized. If the mechanic finds another problem, they must talk to you before repairing it." },
      { heading: "The 3-month or 5,000 km warranty", content: "A repair over $50 is guaranteed for 3 months or 5,000 km, whichever comes first, from the time the vehicle is returned. If the problem comes back during that period, go back to the same garage, which must correct the repair.", note: "The sale and installation of tires billed together isn't considered a repair under these rules, and the same goes for batteries." },
      { heading: "What the garage must post", content: "The garage must post its hourly rate and the main consumer rights for car repairs. Keep your estimates and invoices: they prove the date, odometer reading and work done if you need to claim the warranty." },
    ],
  },
};
