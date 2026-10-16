// Version anglaise des articles de conseils (voir articles.ts). Même ordre de sections que
// l'article français : seuls les textes changent. Un article sans traduction s'affiche en français.

import type { ArticleSection } from "@/lib/articles";

export interface ArticleEn {
  title: string;
  excerpt: string;
  sections: ArticleSection[];
}

/** Catégories d'articles, en anglais. */
export const CATEGORY_EN: Record<string, string> = {
  "Freins": "Brakes",
  "Pneus": "Tires",
  "Électronique": "Electronics",
  "Entretien": "Maintenance",
  "Électrique": "Electrical",
  "Moteur": "Engine",
  "Protection": "Protection",
  "Climatisation": "Air conditioning",
};

import { ARTICLES_RECHERCHES_EN } from "@/lib/articles-recherches-en";

const ARTICLES_EN_BASE: Record<string, ArticleEn> = {
  "voiture-tremble-quand-je-freine": {
    title: "Why does my car shake when I brake?",
    excerpt: "Vibrations under braking often point to warped rotors or worn pads. Learn how to identify the cause and when it is urgent.",
    sections: [
      {
        heading: "A vibration under braking is never harmless",
        content: "If you feel shaking in the steering wheel, the brake pedal or the chassis when you brake, something is wrong with your braking system. Brakes are the most critical safety system on your vehicle, so this symptom deserves prompt attention.",
      },
      {
        heading: "Cause #1: warped brake rotors",
        content: "This is the most common cause. A \"warped\" rotor is no longer perfectly flat: it has a slight wave-shaped distortion. When the pads rub against that uneven surface, they create a rhythmic vibration that travels into the pedal and the steering wheel.",
        tips: [
          "The vibration gets stronger the faster you are braking from",
          "The steering wheel wobbles slightly from left to right",
          "You feel a pulsing in the pedal",
          "Often caused by repeated hard braking or cold water splashed onto hot rotors",
        ],
      },
      {
        heading: "Cause #2: worn or glazed pads",
        content: "Brake pads whose friction material is used up, or whose surface has glazed from overheating, no longer grip the rotor evenly. The result is a vibration, often with a grinding or squealing noise.",
        tips: [
          "Metallic grinding when braking (the wear indicator touching the rotor)",
          "Longer stopping distance",
          "A pedal that travels lower than before",
        ],
      },
      {
        heading: "Cause #3: a suspension or wheel bearing problem",
        content: "If the vibrations are there even without braking but get worse when you brake, the problem may come from the shocks, the ball joints or a failing wheel bearing. In that case the vibrations are often present at high speed and are not limited to braking.",
      },
      {
        heading: "What should you actually do?",
        content: "Have your braking system inspected by a mechanic as soon as possible. A visual inspection of the rotors and pads takes about 20 minutes and pinpoints the cause. The cost of an inspection is nothing compared with the risk of brakes that fail.",
        warning: "If the vibrations are strong or your stopping distance is clearly longer, avoid highways and high speeds until the repair is done. Failing brakes are the leading cause of preventable accidents.",
      },
    ],
  },

  "quand-passer-pneus-hiver-quebec": {
    title: "Winter tires in Quebec: mandatory dates and when to install them",
    excerpt: "The law requires winter tires from December 1 to March 15, but ideally you should install them as soon as the temperature drops below 7 °C.",
    sections: [
      {
        heading: "What Quebec law says",
        content: "In Quebec, the Highway Safety Code requires all passenger vehicles to be fitted with winter tires from December 1 to March 15 inclusive. Not following this rule can lead to a fine of $200 to $300.",
        note: "The rule applies to all passenger vehicles registered in Quebec, including SUVs, pickup trucks and rentals. Studded tires are allowed from October 15 to May 1, and summer tires can go back on from March 16.",
      },
      {
        heading: "The 7 °C rule matters more than the date",
        content: "Winter tires are made of a special rubber that stays flexible below 7 °C. Under that threshold, an all-season or summer tire hardens and loses up to 50% of its grip. Do not wait for the first snowfall: icy roads in the fall and morning frost are just as dangerous.",
        tips: [
          "Install your winter tires when the overnight temperature regularly drops below 7 °C",
          "In Quebec, that is generally between October 15 and 31",
          "Do not wait until November, to avoid the waiting lists at garages",
        ],
      },
      {
        heading: "Four-season tires: allowed only with the pictogram",
        content: "During the mandatory period, a tire must bear the pictogram of a snowflake inside a mountain (or be studded). Four-season tires with this pictogram are therefore allowed; \"all-season\" tires marked only M+S are not. On ice and deep snow, a dedicated winter tire still has the edge.",
      },
      {
        heading: "Storage: how to keep your summer tires",
        content: "To extend the life of your summer tires while they are stored for the winter:",
        tips: [
          "Clean them before storage to remove salt and dirt",
          "Store them in a cool, dark, dry place (ideally between 10 and 20 °C)",
          "Stacked flat or standing upright on a shelf, never hung",
          "Wrapped in opaque bags to protect them from ozone",
        ],
      },
    ],
  },

  "voyants-tableau-de-bord": {
    title: "Dashboard warning lights: what do they mean?",
    excerpt: "Oil pressure, engine, battery, TPMS… Each light has a different level of urgency. This guide explains which ones can wait and which ones mean you must stop right away.",
    sections: [
      {
        heading: "Red lights: stop as soon as possible",
        content: "A red warning light signals a critical problem that can damage your engine or put your safety at risk.",
        tips: [
          "Oil pressure: shut off the engine immediately and check the level",
          "Engine temperature: pull over, open the hood and let it cool down",
          "Battery: the charging system is failing, plan to stop soon",
          "Brake / ABS: a braking problem, slow down and have it checked",
          "Power steering: you can still steer, but with more effort",
        ],
        warning: "Never keep driving with a red light on, especially the oil pressure light. An engine without oil can be destroyed in under 30 seconds.",
      },
      {
        heading: "Orange lights: have it checked in the next few days",
        content: "An orange or yellow light indicates a problem to fix soon, without immediate urgency.",
        tips: [
          "Check Engine: an emissions or sensor problem, have it checked within 48 hours",
          "TPMS (tires): one or more tires are under-inflated, check the pressures",
          "Washer fluid: empty reservoir, top it up at your next stop",
          "Low fuel: you have roughly 50 to 80 km before running out",
          "Service required: a scheduled maintenance is due",
        ],
      },
      {
        heading: "The Check Engine light: don't panic",
        content: "This is the most common and most misunderstood light. It can signal something as trivial as a loose fuel cap, or something more serious like a failing sensor or a clogged catalytic converter. The only way to know is an OBD-II scan at a mechanic or an auto parts store.",
        note: "If the Check Engine light is flashing (instead of steady), it is more urgent: it often means a misfire that can damage the catalytic converter.",
      },
      {
        heading: "TPMS: how to inflate your tires correctly",
        content: "The tire pressure monitoring system (TPMS) lights up when a tire is more than 25% below the recommended pressure. Check the pressure of all 4 tires (plus the spare) with a gauge. The recommended pressure is shown on the sticker inside the driver's door, not on the tire sidewall.",
      },
    ],
  },

  "vidange-huile-frequence": {
    title: "Oil changes: how often, really?",
    excerpt: "Every 3,000 km is a thing of the past. Modern synthetic oils let you drive much longer. Here is the real answer for your vehicle.",
    sections: [
      {
        heading: "The 3,000 km rule is outdated",
        content: "For decades, shops recommended an oil change every 3,000 km. With the mineral oils of the 1980s and 1990s, that made sense. Today, with synthetic oils and modern engines, that advice is largely obsolete, and needlessly expensive.",
      },
      {
        heading: "How often, depending on my oil?",
        content: "How often you change your oil depends mainly on the type of oil and how you drive.",
        tips: [
          "Conventional mineral oil: every 5,000 to 7,500 km",
          "Synthetic blend: every 7,500 to 10,000 km",
          "Full synthetic oil: every 10,000 to 15,000 km (up to 20,000 km for some engines)",
          "Always refer to the owner's manual: it is the official source",
        ],
      },
      {
        heading: "\"Severe\" driving conditions",
        content: "If you drive mostly in the city, take many short trips (the engine never reaches operating temperature), tow often or drive on gravel roads, your engine works harder and the oil breaks down faster. In those cases, divide the recommended interval by 1.5.",
        tips: [
          "Trips of less than 8 km (the engine stays cold)",
          "Driving in very cold weather (below -20 °C)",
          "Frequent towing or heavy loads",
          "Driving on construction or gravel roads",
        ],
      },
      {
        heading: "How to check the oil level yourself",
        content: "Between oil changes, check your oil level every 2 to 3 months or before a long trip. Park on level ground, turn off the engine and wait 5 minutes. Pull out the dipstick, wipe it, put it back in, then pull it out again. The level should sit between the MIN and MAX marks.",
        warning: "If your vehicle uses more than 1 litre of oil per 5,000 km, tell your mechanic. Excessive consumption can point to a leak or internal wear.",
      },
    ],
  },

  "batterie-voiture-duree-vie": {
    title: "Car battery: how long does it last?",
    excerpt: "A battery lasts 3 to 5 years on average, and Quebec's cold wears it out faster. Here is how to know when to replace it and avoid a breakdown at the worst moment.",
    sections: [
      {
        heading: "The real lifespan of a battery",
        content: "On average, a car battery lasts between 3 and 5 years. Some reach 7 years in good conditions, others give out at 2 years under heavy use. Intense cold, a fact of life in Quebec, can cut a battery's capacity by 30 to 50% at -30 °C.",
      },
      {
        heading: "Warning signs of a battery on its way out",
        content: "Don't get caught off guard. A weak battery sends clear signals:",
        tips: [
          "Slow or laboured starts, especially on winter mornings",
          "Interior lights that dim when the engine is off",
          "A click-click-click on start-up (the starter has no power)",
          "The battery or alternator light comes on",
          "The battery is more than 4 years old",
          "Frequent boosts or roadside calls",
        ],
      },
      {
        heading: "Quebec's cold: enemy number one",
        content: "In deep cold, a battery has to deliver far more energy to start an engine whose oil has thickened, while its own capacity is reduced by the freeze. That is why battery failures cluster in November and December and again in January and February. A battery test before winter can spare you a nasty surprise.",
        note: "Most garages and auto parts stores will test your battery for free, usually in about 5 minutes.",
      },
      {
        heading: "Choosing the right replacement battery",
        content: "Every vehicle requires a battery with specific ratings (group size, cold cranking amps or CCA, amp-hours or Ah). Never install an undersized battery to save money: it will fail sooner and can damage the vehicle's electronics.",
        tips: [
          "Check the manual or the label on the old battery",
          "In Quebec, aim for at least 500 CCA (cold cranking amps) for a 4-cylinder engine",
          "AGM batteries (for vehicles with Start/Stop) are not interchangeable with standard batteries",
        ],
      },
    ],
  },

  "moteur-surchauffe-que-faire": {
    title: "My engine is overheating: what to do and what to avoid",
    excerpt: "A temperature needle in the red is an emergency. Here are the right reflexes, and above all the mistakes not to make.",
    sections: [
      {
        heading: "The first signs of overheating",
        content: "The temperature needle climbs toward the red, a cloud of steam comes out from under the hood or a burning smell enters the cabin. These are warning signs to take seriously right away.",
        warning: "An overheating engine can reach destructive temperatures in under 2 minutes. Driving on can warp the cylinder head, a $2,000 to $5,000 repair.",
      },
      {
        heading: "What to do when it overheats",
        content: "Follow these steps in order:",
        tips: [
          "1. Turn off the air conditioning immediately",
          "2. Turn the heater on full (it helps pull heat away from the engine)",
          "3. If that is not enough, pull over as soon as it is safe",
          "4. Shut off the engine and wait 20 to 30 minutes before opening the hood",
          "5. Never open the radiator cap while the engine is hot: risk of serious burns",
          "6. Check the coolant level (in the clear reservoir, not the radiator)",
        ],
      },
      {
        heading: "The most common causes",
        content: "Overheating is rarely sudden. There is an underlying cause:",
        tips: [
          "Coolant leak (punctured hose, failing head gasket)",
          "Thermostat stuck closed",
          "Cooling fan not working",
          "Clogged or damaged radiator",
          "Failing water pump",
        ],
      },
      {
        heading: "Prevention: have your cooling system checked",
        content: "Have your cooling system inspected every 2 years or 40,000 km. Coolant breaks down over time, loses its anti-corrosion properties and can leave deposits that clog the radiator. A coolant flush costs between $80 and $150, far less than the consequences of overheating.",
      },
    ],
  },

  "antirouille-quebec-necessaire": {
    title: "Rustproofing in Quebec: is it really essential?",
    excerpt: "Quebec's road salt is especially hard on a vehicle's body. Here is what you need to know about rustproofing treatments and how well they really work.",
    sections: [
      {
        heading: "Why Quebec is especially hard on vehicles",
        content: "Quebec spreads several million tonnes of road salt on its roads every year. That salt, combined with moisture and the freeze-thaw cycle (sometimes several times a week), creates an extremely corrosive environment for a vehicle's body and underbody.",
      },
      {
        heading: "The different types of rust protection",
        content: "Not all treatments are equal:",
        tips: [
          "Rust-inhibiting oil (underbody spray): the most effective for the underbody, it seeps into seams and cavities. Reapply every 1 to 2 years.",
          "Wax or polymer: surface protection for painted body panels.",
          "Electronic (electronic waves): effectiveness has not been scientifically proven.",
          "Cavity treatment (injected into doors and rocker panels): very effective for hollow areas.",
        ],
      },
      {
        heading: "When to apply it, and how often?",
        content: "The best time for a rustproofing treatment is in the fall, before the first snow and before the salt appears. For a new vehicle, do it within the first few months. For a used vehicle, have the existing rust cleaned off first, then apply the product.",
        tips: [
          "New or recent vehicle: treatment within the first 6 months, then every 2 years",
          "Vehicle more than 5 years old: yearly inspection, treatment every 1 to 2 years",
          "After each winter: high-pressure wash of the underbody",
        ],
      },
      {
        heading: "A good habit: regular winter washes",
        content: "Beyond treatments, the best protection is still to wash your vehicle regularly throughout the winter, especially the underbody. After each thaw or rain followed by a freeze, salt residue dries and its corrosive action becomes more concentrated. Washing twice a month can double the life of your underbody.",
      },
    ],
  },

  "freins-qui-grincent": {
    title: "Squeaking brakes: dangerous or just annoying?",
    excerpt: "Not every brake noise is alarming, but some are. Learn to tell a normal noise from an emergency.",
    sections: [
      {
        heading: "A squeak in the morning: often normal",
        content: "In damp weather or after a cool night, a thin layer of surface rust forms on the brake rotors. The first few stops rub it off, causing a temporary squeak or squeal. If the noise goes away after 2 or 3 stops, there is nothing to worry about.",
      },
      {
        heading: "A persistent noise: signs you should not ignore",
        content: "A noise that lasts throughout your drive is a different signal:",
        tips: [
          "Constant metallic grinding: the wear indicators (a metal tab built into the pads) are rubbing on the rotor, replace urgently",
          "High-pitched squeal every time you brake: poor-quality pads, or pads glazed by heat",
          "Deep grinding noise: the pad is completely worn, metal on metal. Very urgent, the rotors are being damaged",
          "Squeaking with vibration: worn or warped rotors on top of the pads",
        ],
        warning: "The grinding noise (the sound of metal chewing metal) is an emergency. Every kilometre driven this way destroys your brake rotor, and the repair goes from pads alone to a full rotor and pad replacement.",
      },
      {
        heading: "What does it cost to do nothing?",
        content: "Worn pads left too long end up damaging the rotors. Replacing the pads alone costs about $150 to $250. If the rotors also need replacing: $300 to $600 per axle. Acting early is always cheaper.",
      },
    ],
  },

  "climatisation-ne-refroidit-plus": {
    title: "My car's A/C no longer cools: causes and fixes",
    excerpt: "An air conditioner that blows warm air in midsummer is often low on refrigerant. Here is what to know before you go to a mechanic.",
    sections: [
      {
        heading: "Why the A/C loses its cooling power",
        content: "The air conditioning circuit is a closed system containing refrigerant gas (R-134a or R-1234yf depending on the vehicle's age). By nature, this gas can slowly escape over the years, up to 15% a year depending on conditions. After a few years, the amount of refrigerant falls below the minimum and the A/C stops cooling.",
      },
      {
        heading: "The most common causes",
        content: "Before assuming it only needs a recharge:",
        tips: [
          "Low refrigerant (the most common cause, especially on vehicles over 5 years old)",
          "Condenser clogged by insects or debris (a cleaning is sometimes enough)",
          "Failing compressor (a clacking noise when the A/C switches on)",
          "Faulty thermostat or pressure sensor",
          "A leak in the circuit (a recharge is pointless unless the leak is fixed first)",
        ],
      },
      {
        heading: "DIY recharge or a professional?",
        content: "Do-it-yourself recharge kits are sold in stores, but they have major limits. They cannot detect a leak, they do not recover the old refrigerant (required by law), and they can overfill the circuit if used incorrectly. For a reliable result, a professional recharge with a recovery station is always the better choice.",
        note: "A professional recharge includes a leak test, recovery of the old gas, vacuuming the system and refilling to the exact quantity. Expect to pay $100 to $180 for this service.",
      },
      {
        heading: "Preventive care: use the A/C in winter too",
        content: "A little-known good habit: run your air conditioning for a few minutes each month, even in winter. This lubricates the seals and the compressor and keeps them from drying out and leaking. Many modern cars in fact switch the A/C on automatically when you use the defrost mode.",
      },
    ],
  },

  "consommation-essence-anormale": {
    title: "Abnormal fuel consumption: the real causes",
    excerpt: "Is your car suddenly using more fuel than usual? Several simple causes can explain the increase, and most are easy to fix.",
    sections: [
      {
        heading: "How to measure your real consumption",
        content: "Before you panic, check your actual consumption. Fill the tank to the brim, note the odometer reading, then drive normally until the tank is half empty or fill up completely again. Divide the litres added by the kilometres driven and multiply by 100. Compare the result with the normal consumption for your model.",
      },
      {
        heading: "Mechanical causes to check first",
        content: "Several mechanical problems directly increase consumption:",
        tips: [
          "Under-inflated tires: every 7 kPa missing means about 1% more fuel",
          "Clogged air filter: reduces combustion efficiency",
          "Worn spark plugs: incomplete combustion means more fuel for the same power",
          "Faulty O2 sensor: the engine injects too much or too little fuel",
          "Thermostat stuck open: an engine that never warms up runs rich",
          "Dragging brake pads: constant resistance means more work for the engine",
        ],
      },
      {
        heading: "Causes related to how you drive",
        content: "Before suspecting a fault, check whether your driving has changed:",
        tips: [
          "More short trips (a cold engine uses 2 to 3 times more fuel)",
          "Air conditioning running all the time (10 to 20% more fuel)",
          "A loaded trunk or a roof rack adding drag",
          "Aggressive driving (hard acceleration, late braking)",
          "Lower-quality fuel",
        ],
      },
      {
        heading: "When should you see a mechanic?",
        content: "If consumption has gone up by more than 15% with no change in your habits, have a diagnostic done. Most causes are cheap to fix (air filter: $30, spark plugs: $60 to $120), but if ignored they cost a lot in fuel over the long run.",
      },
    ],
  },

  "preparer-voiture-hiver-quebec": {
    title: "Getting your car ready for a Quebec winter",
    excerpt: "A Quebec winter puts your vehicle through a lot. This complete checklist makes sure you drive safely from November to March.",
    sections: [
      {
        heading: "Tires and brakes: the top priority",
        content: "Before anything else, your winter tires and your brakes must be in perfect condition. A vehicle will not stop on snow if its brakes are weak: the laws of physics make no exceptions.",
        tips: [
          "Install winter tires as soon as the temperature drops below 7 °C",
          "Check the tread depth (legal minimum: 1.6 mm, recommended: 4 mm or more)",
          "Have the brakes and rotors inspected before the season",
          "Check tire pressure after each cold snap (pressure drops about 1 PSI for every 6 °C)",
        ],
      },
      {
        heading: "Battery: test it before the freeze",
        content: "A battery that struggles to start in October will not make it through January. Have it tested for free at any garage or auto parts store before November. If it is more than 4 years old and showing signs of weakness, replace it now.",
      },
      {
        heading: "Fluids to check",
        content: "Every fluid plays a crucial role in winter:",
        tips: [
          "Coolant: check the freeze protection (ideally down to -40 °C in Quebec)",
          "Washer fluid: use only a winter product (-40 °C), never water",
          "Engine oil: check whether a thinner oil is recommended for extreme cold",
          "Brake fluid: if it has absorbed moisture, change it before winter",
        ],
      },
      {
        heading: "Visibility: don't overlook the basics",
        content: "In winter, you often drive in reduced visibility.",
        tips: [
          "Replace the wiper blades (winter models recommended)",
          "Check the rear defroster and the heated mirrors",
          "Test the headlights and check their aim",
          "Always clear all the snow off the vehicle before driving (required by law)",
        ],
        warning: "A car that is only partly cleared can throw chunks of snow onto other drivers. It is an offence under the Highway Safety Code and a serious hazard.",
      },
      {
        heading: "Winter emergency kit",
        content: "Keep these items in your trunk all winter:",
        tips: [
          "Booster cables (or a portable jump starter)",
          "Ice scraper and snow brush",
          "A bag of gravel or cat litter (to get unstuck)",
          "Emergency blanket, water, a granola bar",
          "Flashlight with fresh batteries",
          "Tow strap",
        ],
      },
    ],
  },

  "pression-pneus-comment-verifier": {
    title: "Tire pressure: how to check it and how much to inflate",
    excerpt: "Poorly inflated tires wear unevenly, increase fuel consumption and reduce grip. Checking takes 5 minutes. Here is how.",
    sections: [
      {
        heading: "What pressure is recommended for my vehicle?",
        content: "The recommended pressure is NOT the one printed on the tire sidewall: that is the maximum pressure the tire can handle. The correct pressure is shown on a sticker on the driver's door jamb (sometimes also inside the fuel door or in the owner's manual).",
        note: "Front and rear pressures can be different. On some SUVs and pickup trucks, the recommended pressure also changes with the load.",
      },
      {
        heading: "How to measure correctly",
        content: "For a reliable reading, always check the pressure cold: before driving, or after less than 2 km. Heat from the road expands the air and throws the reading off by about 4 to 6 PSI.",
        tips: [
          "Remove the valve cap",
          "Press the gauge firmly onto the valve (a hiss means it is not seated properly)",
          "Read the pressure in PSI or kPa, depending on your gauge",
          "Compare it with the value on the door sticker",
          "Adjust: add air, or release some by pressing on the valve core",
          "Check again after adjusting",
        ],
      },
      {
        heading: "How Quebec's cold affects pressure",
        content: "Tire pressure drops by about 1 PSI (7 kPa) for every 6 °C drop in temperature. Between summer (+30 °C) and a winter morning (-25 °C), you can lose 9 PSI, which is 20 to 25% of the recommended pressure for most vehicles. That is why the TPMS light often comes on in the fall even though there is no leak.",
        tips: [
          "Check the pressure at the start of the cold season and after each severe cold snap",
          "Ideal frequency: once a month",
          "Don't forget the spare tire",
        ],
      },
    ],
  },
};

/** Tous les articles en anglais, y compris ceux écrits à partir des recherches. */
export const ARTICLES_EN: Record<string, ArticleEn> = { ...ARTICLES_EN_BASE, ...ARTICLES_RECHERCHES_EN };
