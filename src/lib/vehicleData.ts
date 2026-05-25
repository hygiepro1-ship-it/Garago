// VEHICLE_MAKES is defined in vehicleBrands.ts (single source of truth).
// Re-exported here so existing imports keep working unchanged.
export { VEHICLE_MAKES } from "@/lib/vehicleBrands";

// Models per make
export const VEHICLE_MODELS: Record<string, string[]> = {
  // ── Exotic / Luxury ──────────────────────────────────────
  "Aston Martin": ["DB11", "DB12", "DBS", "DBX", "Vantage", "Valkyrie"],
  "Bentley":      ["Bentayga", "Continental GT", "Flying Spur", "Mulsanne"],
  "BYD":          ["Atto 3", "Han", "Seal", "Tang", "Dolphin"],
  "Ferrari":      ["296 GTB", "296 GTS", "296 GT3", "F8 Tributo", "F8 Spider", "Portofino M", "Roma", "SF90 Stradale", "812 Superfast", "Purosangue"],
  "Lamborghini":  ["Huracán", "Huracán Spyder", "Huracán Sterrato", "Urus", "Urus S", "Urus Performante", "Revuelto"],
  "Lotus":        ["Eletre", "Emira", "Evija"],
  "Lucid":        ["Air Pure", "Air Touring", "Air Grand Touring", "Air Sapphire"],
  "Maserati":     ["Ghibli", "GranTurismo", "GranCabrio", "Levante", "Quattroporte", "Grecale", "MC20"],
  "McLaren":      ["Artura", "GT", "720S", "750S", "765LT", "Senna"],
  "Rolls-Royce":  ["Cullinan", "Ghost", "Phantom", "Silver Shadow", "Spectre", "Wraith"],
  // ── Standard ────────────────────────────────────────────
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale"],
  Acura: ["ILX", "MDX", "RDX", "TLX", "NSX"],
  Audi: ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "e-tron", "TT", "RS3", "RS6"],
  BMW: ["Série 1", "Série 2", "Série 3", "Série 4", "Série 5", "Série 7", "X1", "X3", "X5", "X7", "iX", "i4", "M3", "M5"],
  Buick: ["Enclave", "Encore", "Encore GX", "Envision"],
  Cadillac: ["CT4", "CT5", "Escalade", "Lyriq", "XT4", "XT5", "XT6"],
  Chevrolet: ["Blazer", "Bolt EV", "Camaro", "Colorado", "Equinox", "Malibu", "Silverado 1500", "Silverado 2500", "Spark", "Tahoe", "Trailblazer", "Traverse"],
  Chrysler: ["300", "Pacifica", "Voyager"],
  Dodge: ["Challenger", "Charger", "Durango", "Grand Caravan", "Hornet"],
  Fiat: ["500", "500X", "500L"],
  Polestar: ["2", "3", "4"],
  Rivian: ["R1T", "R1S"],
  Ford: ["Bronco", "Edge", "Escape", "Expedition", "Explorer", "F-150", "F-250", "Maverick", "Mustang", "Mustang Mach-E", "Ranger", "Transit"],
  Genesis: ["G70", "G80", "G90", "GV70", "GV80"],
  GMC: ["Acadia", "Canyon", "Sierra 1500", "Sierra 2500", "Terrain", "Yukon"],
  Honda: ["Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Passport", "Pilot", "Ridgeline"],
  Hyundai: ["Elantra", "Ioniq 5", "Ioniq 6", "Kona", "Palisade", "Santa Cruz", "Santa Fe", "Sonata", "Tucson", "Venue"],
  Infiniti: ["Q50", "Q60", "QX50", "QX55", "QX60", "QX80"],
  Jaguar: ["E-Pace", "F-Pace", "F-Type", "I-Pace", "XE", "XF"],
  Jeep: ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wrangler"],
  Kia: ["Carnival", "EV6", "Forte", "K5", "Niro", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
  "Land Rover": ["Defender", "Discovery", "Range Rover", "Range Rover Sport", "Range Rover Velar"],
  Lexus: ["ES", "GX", "IS", "LC", "LS", "LX", "NX", "RX", "UX"],
  Lincoln: ["Aviator", "Corsair", "Nautilus", "Navigator"],
  Mazda: ["CX-30", "CX-5", "CX-50", "CX-90", "Mazda3", "Mazda6", "MX-5 Miata"],
  "Mercedes-Benz": ["Classe A", "Classe C", "Classe E", "Classe S", "GLA", "GLB", "GLC", "GLE", "GLS", "EQS", "AMG GT", "Sprinter"],
  MINI: ["Clubman", "Convertible", "Cooper", "Countryman"],
  Mitsubishi: ["Eclipse Cross", "Outlander", "Outlander PHEV", "RVR"],
  Nissan: ["Altima", "Armada", "Kicks", "Leaf", "Maxima", "Murano", "Pathfinder", "Qashqai", "Rogue", "Sentra", "Titan", "Versa"],
  Porsche: ["718 Boxster", "718 Cayman", "911", "Cayenne", "Macan", "Panamera", "Taycan"],
  RAM: ["1500", "2500", "3500", "ProMaster"],
  Subaru: ["Ascent", "BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "Solterra", "WRX"],
  Tesla: ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y"],
  Toyota: ["4Runner", "Avalon", "Camry", "Corolla", "Crown", "GR86", "Highlander", "Land Cruiser", "Prius", "RAV4", "Sequoia", "Sienna", "Tacoma", "Tundra", "Venza", "bZ4X"],
  Volkswagen: ["Atlas", "Golf", "ID.4", "Jetta", "Passat", "Taos", "Tiguan"],
  Volvo: ["C40 Recharge", "S60", "S90", "V60", "V90", "XC40", "XC60", "XC90"],
};

// Trims/versions per model
export const VEHICLE_TRIMS: Record<string, string[]> = {
  // Toyota
  "Camry": ["LE", "SE", "XSE", "XLE", "TRD V6", "XSE V6", "Hybride LE", "Hybride SE", "Hybride XLE"],
  "Corolla": ["L", "LE", "SE", "XSE", "XLE", "Hybride LE", "Hybride SE", "Hybride XLE", "Hybride XSE"],
  "RAV4": ["LE", "XLE", "XLE Premium", "TRD Off-Road", "Adventure", "Limited", "Hybride LE", "Hybride XLE", "Hybride XSE", "Hybride Limited", "Prime SE", "Prime XSE"],
  "Highlander": ["L", "LE", "XLE", "Limited", "Platinum", "Hybride LE", "Hybride XLE", "Hybride Limited", "Hybride Platinum"],
  "Prius": ["L Eco", "LE", "XLE", "Limited", "Prime LE", "Prime XLE", "Prime Premium"],
  "Tacoma": ["SR", "SR5", "TRD Sport", "TRD Off-Road", "Limited", "TRD Pro", "Trail Edition"],
  "Tundra": ["SR", "SR5", "Limited", "Platinum", "1794 Edition", "TRD Pro", "Hybride SR5", "Hybride Limited"],
  "4Runner": ["SR5", "SR5 Premium", "TRD Off-Road", "TRD Off-Road Premium", "TRD Pro", "Limited", "40th Anniversary"],
  "Sienna": ["L", "LE", "XLE", "Limited", "Platinum", "Hybride XSE"],
  "Venza": ["LE", "XLE", "Limited"],
  "bZ4X": ["XLE", "Limited"],
  "GR86": ["Base", "Premium"],
  "Crown": ["XLE", "Limited", "Platinum"],
  // Honda
  "Civic": ["LX", "EX", "Sport", "EX-L", "Touring", "Si", "Type R"],
  "Accord": ["LX", "EX", "EX-L", "Sport", "Sport-L", "Touring", "Hybride Sport", "Hybride EX-L", "Hybride Touring"],
  "CR-V": ["LX", "EX", "EX-L", "Sport", "Touring", "Hybride Sport", "Hybride EX-L", "Hybride Touring"],
  "HR-V": ["LX", "EX", "EX-L", "Sport"],
  "Pilot": ["Sport", "EX-L", "TrailSport", "Elite"],
  "Odyssey": ["LX", "EX", "EX-L", "Elite"],
  "Ridgeline": ["Sport", "RTL", "RTL-E", "Black Edition"],
  "Passport": ["Sport", "EX-L", "TrailSport", "Elite"],
  // Ford
  "F-150": ["Regular Cab XL", "Regular Cab XLT", "SuperCab XL", "SuperCab XLT", "SuperCab Lariat", "SuperCrew XL", "SuperCrew XLT", "SuperCrew Lariat", "SuperCrew King Ranch", "SuperCrew Platinum", "SuperCrew Limited", "Raptor", "Hybride XLT", "Hybride Lariat", "Hybride Platinum"],
  "Escape": ["S", "SE", "SE Sport", "SEL", "Titanium", "PHEV SE", "PHEV Titanium"],
  "Explorer": ["Base", "XLT", "ST-Line", "ST", "Limited", "Platinum", "King Ranch", "Timberline"],
  "Mustang": ["EcoBoost", "EcoBoost Premium", "GT", "GT Premium", "Mach 1", "Shelby GT500"],
  "Mustang Mach-E": ["Select", "Premium", "California Route 1", "GT", "GT Performance"],
  "Bronco": ["Base", "Big Bend", "Black Diamond", "Outer Banks", "Badlands", "Wildtrak", "Everglades", "Raptor"],
  "Ranger": ["XL", "XLT", "Lariat", "Tremor", "Raptor"],
  "Maverick": ["XL", "XLT", "Lariat"],
  "Edge": ["SE", "SEL", "ST-Line", "ST", "Titanium"],
  "Expedition": ["XLT", "Limited", "Timberline", "King Ranch", "Platinum", "Stealth Edition"],
  "Transit": ["Cargo Van T-150", "Cargo Van T-250", "Cargo Van T-350", "Fourgon"],
  // Chevrolet
  "Silverado 1500": ["WT", "Custom", "Custom Trail Boss", "LT", "LT Trail Boss", "RST", "LTZ", "High Country", "ZR2"],
  "Equinox": ["LS", "LT", "RS", "Premier", "EV LT", "EV RS"],
  "Traverse": ["LS", "LT", "RS", "Premier", "High Country"],
  "Colorado": ["WT", "LT", "Trail Boss", "Z71", "ZR2"],
  "Tahoe": ["LS", "LT", "RST", "Z71", "Premier", "High Country"],
  "Camaro": ["LS", "LT", "LT1", "SS", "ZL1", "Édition Cabriolet"],
  "Blazer": ["LT", "RS", "Premier"],
  "Bolt EV": ["LT", "Premier"],
  "Trailblazer": ["LS", "LT", "ACTIV", "RS", "Premier"],
  // Hyundai
  "Tucson": ["Essential", "Preferred", "N Line", "Ultimate", "PHEV Preferred", "PHEV Ultimate"],
  "Santa Fe": ["Essential", "Preferred", "XRT", "Luxury", "PHEV Preferred", "PHEV Luxury"],
  "Elantra": ["Essential", "Preferred", "N Line", "Ultimate", "N", "Hybride Essential", "Hybride Preferred"],
  "Sonata": ["Essential", "Preferred", "N Line", "Ultimate", "Hybride Essential", "Hybride Luxury", "Hybride Ultimate"],
  "Kona": ["Essential", "Preferred", "N Line", "Ultimate", "EV Essential", "EV Preferred", "EV Ultimate"],
  "Palisade": ["Essential", "Preferred", "Luxury", "Urban", "XRT", "Calligraphy"],
  "Venue": ["Essential", "Preferred", "Ultimate"],
  "Ioniq 5": ["Standard Range", "Long Range RWD", "Long Range AWD", "N Line", "N"],
  "Ioniq 6": ["Standard Range", "Long Range RWD", "Long Range AWD"],
  "Santa Cruz": ["Essential", "Preferred", "Sport", "Ultimate"],
  // Kia
  "Sportage": ["LX", "EX", "EX Premium", "SX", "SX Prestige", "X-Line", "PHEV EX", "PHEV SX"],
  "Sorento": ["LX", "S", "EX", "SX", "SX Prestige", "X-Line", "PHEV EX", "PHEV SX Prestige"],
  "Telluride": ["LX", "S", "EX", "EX X-Line", "SX", "SX Prestige", "X-Pro", "X-Pro Prestige"],
  "K5": ["LX", "GT-Line", "EX", "GT"],
  "Forte": ["LX", "GT-Line", "EX", "GT"],
  "Stinger": ["GT", "GT2", "GT-Line"],
  "EV6": ["Standard Range", "Long Range", "GT-Line", "GT"],
  "Seltos": ["LX", "EX", "EX Premium", "SX Turbo"],
  "Niro": ["LX", "EX", "EX Premium", "SX Touring", "EV LX", "EV EX", "EV EX Premium", "EV SX Prestige", "PHEV LX"],
  "Soul": ["LX", "EX", "GT-Line", "GT-Line Turbo"],
  "Carnival": ["LX", "EX", "SX", "SX Prestige"],
  // Nissan
  "Rogue": ["S", "SV", "SL", "Platinum"],
  "Qashqai": ["S", "SV", "SL", "Platinum"],
  "Murano": ["S", "SV", "SL", "Platinum"],
  "Altima": ["S", "SV", "SR", "SL", "Platinum", "Edition One"],
  "Sentra": ["S", "SV", "SR"],
  "Versa": ["S", "SV", "SR"],
  "Pathfinder": ["S", "SV", "SL", "Platinum", "Rock Creek"],
  "Kicks": ["S", "SV", "SR"],
  "Leaf": ["S", "SV", "SV Plus", "SL Plus"],
  "Titan": ["S", "SV", "Pro-4X", "SL", "Platinum Reserve"],
  "Armada": ["S", "SV", "SL", "Platinum"],
  "Maxima": ["S", "SV", "SR", "SL", "Platinum"],
  // Mazda
  "Mazda3": ["GX", "GS", "GT", "Turbo"],
  "CX-5": ["GX", "GS", "GT", "GT Turbo", "Signature"],
  "CX-50": ["GX", "GS", "GT", "GT Turbo", "Meridian Edition"],
  "CX-90": ["GS", "GS-L", "GT", "GT Turbo", "Signature", "PHEV GS", "PHEV GT"],
  "CX-30": ["GX", "GS", "GT", "Turbo"],
  "Mazda6": ["GS", "GT", "GT Turbo", "Signature"],
  "MX-5 Miata": ["GX", "GS", "GT", "RF GS-P", "RF GT"],
  // Subaru
  "Outback": ["Base", "Premium", "Limited", "Onyx Edition", "Onyx Edition XT", "Limited XT", "Touring", "Touring XT"],
  "Forester": ["Base", "Premium", "Sport", "Limited", "Touring"],
  "Crosstrek": ["Base", "Premium", "Sport", "Limited", "Wilderness", "PHEV"],
  "Impreza": ["Base", "Premium", "Sport", "Limited"],
  "Legacy": ["Base", "Premium", "Sport", "Limited", "Touring XT"],
  "Ascent": ["Base", "Premium", "Onyx Edition", "Limited", "Touring"],
  "WRX": ["Base", "Premium", "Limited", "GT", "STI"],
  "BRZ": ["Base", "Premium", "Limited"],
  "Solterra": ["Touring"],
  // BMW
  "Série 3": ["320i", "330i", "330i xDrive", "340i", "340i xDrive", "M340i", "M340i xDrive", "330e", "330e xDrive", "M3", "M3 Competition"],
  "Série 5": ["530i", "530i xDrive", "540i", "540i xDrive", "550e xDrive", "M550i xDrive", "M5", "M5 Competition"],
  "X3": ["sDrive30i", "xDrive30i", "M40i", "M40d"],
  "X5": ["sDrive40i", "xDrive40i", "xDrive50e", "M50i", "M Competition"],
  // Mercedes-Benz
  "Classe C": ["C 300", "C 300 4MATIC", "C 43 AMG 4MATIC", "C 63 AMG", "C 63 AMG S", "C 300e 4MATIC"],
  "Classe E": ["E 350", "E 350 4MATIC", "E 450 4MATIC", "AMG E 53", "AMG E 63 S"],
  "GLC": ["GLC 300", "GLC 300 4MATIC", "AMG GLC 43", "AMG GLC 63", "GLC 350e 4MATIC"],
  "GLE": ["GLE 350", "GLE 350 4MATIC", "GLE 450 4MATIC", "AMG GLE 53", "AMG GLE 63 S"],
  // Volkswagen
  "Jetta": ["Trendline", "Comfortline", "Highline", "Sport", "GLI"],
  "Golf": ["Comfortline", "Highline", "R-Line", "GTI", "R"],
  "Tiguan": ["Trendline", "Comfortline", "Highline", "R-Line", "Édition SEL"],
  "Atlas": ["Trendline", "Comfortline", "Highline", "Execline"],
  "Taos": ["Trendline", "Comfortline", "Highline"],
  "ID.4": ["Standard", "Pro", "Pro S", "AWD Pro", "AWD Pro S"],
  "Passat": ["Trendline", "Comfortline", "Highline", "Execline"],
  // Jeep
  "Grand Cherokee": ["Laredo", "Altitude", "Limited", "Overland", "Summit", "Summit Reserve", "Trailhawk", "4xe", "SRT", "Trackhawk"],
  "Wrangler": ["Sport", "Sport S", "Willys", "Rubicon", "Sahara", "High Altitude", "4xe Sport", "4xe Rubicon", "4xe Sahara"],
  "Cherokee": ["Sport", "Latitude", "Latitude Lux", "Trailhawk", "Limited", "Overland"],
  "Compass": ["Sport", "North", "Trailhawk", "Limited", "High Altitude"],
  "Gladiator": ["Sport", "Sport S", "Willys", "Overland", "Rubicon"],
  "Renegade": ["Sport", "North", "Trailhawk", "Limited"],
  // RAM
  "1500": ["Tradesman", "Big Horn", "Laramie", "Rebel", "Longhorn", "Limited", "TRX"],
  "2500": ["Tradesman", "Big Horn", "Laramie", "Power Wagon", "Limited", "Longhorn"],
  "3500": ["Tradesman", "Big Horn", "Laramie", "Limited", "Longhorn"],
  "ProMaster": ["1500", "2500", "3500"],
  // Tesla
  "Model 3": ["Standard Range+", "Long Range AWD", "Performance"],
  "Model Y": ["Long Range AWD", "Performance", "Cyberbeast"],
  "Model S": ["Plaid"],
  "Model X": ["Plaid"],
  "Cybertruck": ["RWD", "AWD", "Cyberbeast"],
  // Volvo
  "XC60": ["Core", "Plus", "Ultimate", "Recharge Plus", "Recharge Ultimate"],
  "XC90": ["Core", "Plus", "Ultimate", "Recharge Plus", "Recharge Ultimate"],
  "XC40": ["Core", "Plus", "Ultimate", "Recharge Plus", "Recharge Twin"],
  "S60": ["Core", "Plus", "Ultimate", "Recharge"],
  "S90": ["Core", "Plus", "Ultimate", "Recharge"],
  "V60": ["Core", "Plus", "Ultimate"],
  "V90": ["Core", "Plus", "Ultimate"],
  "C40 Recharge": ["Plus", "Ultimate"],
  // Audi
  "A4": ["40 TFSI", "45 TFSI quattro", "S4 quattro"],
  "A6": ["45 TFSI quattro", "55 TFSI quattro", "S6", "RS6"],
  "Q5": ["45 TFSI quattro", "55 TFSI e quattro", "SQ5"],
  "Q7": ["45 TFSI quattro", "55 TFSI quattro", "SQ7"],
  "e-tron": ["55 quattro", "60 quattro S"],
  // Acura
  "MDX": ["Base", "Standard", "A-Spec", "Advance", "SH-AWD A-Spec", "SH-AWD Advance", "Type S", "Type S Ultra"],
  "RDX": ["Base", "A-Spec", "Advance", "A-Spec Advance"],
  "TLX": ["Base", "A-Spec", "Advance", "SH-AWD A-Spec", "Type S", "Type S Ultra"],
  // Lexus
  "RX": ["RX 350", "RX 350 AWD", "RX 500h AWD F SPORT", "RX 450h AWD", "RX 450h+ AWD"],
  "NX": ["NX 250", "NX 250 AWD", "NX 350 AWD F SPORT", "NX 350h AWD", "NX 450h+ AWD"],
  "ES": ["ES 250 AWD", "ES 300h", "ES 350"],
  "IS": ["IS 300", "IS 300 AWD", "IS 350", "IS 350 AWD", "IS 500 F SPORT"],
  // Lincoln
  "Nautilus": ["Standard", "Reserve", "Black Label"],
  "Aviator": ["Standard", "Reserve", "Black Label", "Grand Touring"],
  "Navigator": ["Standard", "Reserve", "Black Label"],
  "Corsair": ["Standard", "Reserve", "Grand Touring"],
  // Genesis
  "GV70": ["Standard", "Advanced", "Prestige", "Sport", "Sport Prestige", "Electrified"],
  "GV80": ["Standard", "Advanced", "Prestige"],
  "G80": ["Standard", "Advanced", "Prestige", "Sport Advanced", "Sport Prestige", "Electrified"],
  "G70": ["Standard", "Advanced", "Prestige"],
  "G90": ["Standard", "Advanced", "Prestige"],
  // Fiat
  "500": ["Pop", "Lounge", "Abarth"],
  "500X": ["Pop", "Trekking", "Trekking Plus"],
  // Polestar
  "2": ["Standard Range", "Long Range Single", "Long Range Dual", "BST Edition"],
  "3": ["Long Range Single", "Long Range Dual", "Long Range Dual Performance"],
  "4": ["Long Range Single", "Long Range Dual", "Long Range Dual BST"],
  // Rivian
  "R1T": ["Standard", "Adventure", "Launch Edition"],
  "R1S": ["Standard", "Adventure", "Launch Edition"],
  // Buick
  "Enclave": ["Preferred", "Essence", "Premium", "Avenir"],
  "Encore": ["Preferred", "Essence", "Premium"],
  "Encore GX": ["Preferred", "Select", "Essence", "Premium"],
  "Envision": ["Preferred", "Essence", "Premium", "Avenir"],
  // Cadillac
  "XT4": ["Luxury", "Premium Luxury", "Sport"],
  "XT5": ["Luxury", "Premium Luxury", "Sport", "Platinum"],
  "XT6": ["Luxury", "Premium Luxury", "Sport", "Platinum"],
  "CT4": ["Luxury", "Premium Luxury", "Sport", "V-Series", "V-Series Blackwing"],
  "CT5": ["Luxury", "Premium Luxury", "Sport", "V-Series", "V-Series Blackwing"],
  "Escalade": ["Luxury", "Premium Luxury", "Sport", "Platinum", "ESV Luxury", "ESV Platinum"],
  // Infiniti
  "Q50": ["Pure", "Luxe", "Red Sport 400", "Sensory"],
  "Q60": ["Pure", "Luxe", "Red Sport 400", "Sensory"],
  "QX50": ["Pure", "Luxe", "Sensory", "Autograph"],
  "QX55": ["Pure", "Luxe", "Sensory", "Autograph"],
  "QX60": ["Pure", "Luxe", "Sensory", "Autograph"],
  "QX80": ["Pure", "Luxe", "Sensory", "Autograph"],
  // Porsche
  "Cayenne": ["Base", "S", "GTS", "Turbo", "Turbo S", "e-Hybrid", "Turbo S e-Hybrid"],
  "Macan": ["Base", "S", "GTS", "Turbo", "4", "4S", "4 Electric"],
  "911": ["Carrera", "Carrera S", "Carrera 4", "Carrera 4S", "Targa 4", "Targa 4S", "GT3", "Turbo", "Turbo S"],
  "Panamera": ["Base", "4", "4S", "GTS", "Turbo S", "4 e-Hybrid", "Turbo S e-Hybrid"],
  "Taycan": ["Base", "4", "4S", "GTS", "Turbo", "Turbo S", "Cross Turismo"],
  // BMW X1/X7
  "X1": ["sDrive28i", "xDrive28i", "M35i"],
  "X7": ["xDrive40i", "xDrive50i", "M60i", "M Competition"],
  // Mitsubishi
  "Outlander": ["ES", "SE", "SEL", "SEL Premium"],
  "Eclipse Cross": ["ES", "SE", "SEL", "SEL Premium"],
  "RVR": ["ES", "SE", "SE Limited", "GT", "GT S-AWC"],
  "Outlander PHEV": ["ES", "SE", "SEL", "SEL Premium"],
  // Jaguar
  "F-Pace": ["P250 S", "P250 SE", "P250 R-Dynamic SE", "P400 R-Dynamic HSE", "SVR"],
  "E-Pace": ["S", "SE", "R-Dynamic SE"],
  // Land Rover
  "Range Rover": ["SE", "HSE", "Autobiography", "SVAutobiography"],
  "Range Rover Sport": ["S", "SE", "HSE", "Autobiography"],
  "Defender": ["90 S", "90 SE", "90 HSE", "110 S", "110 SE", "110 HSE", "110 X"],
  "Discovery": ["S", "SE", "HSE", "R-Dynamic SE"],
};

export function getYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear + 1; y >= 1995; y--) {
    years.push(y);
  }
  return years;
}

export function getModelsForMake(make: string): string[] {
  return VEHICLE_MODELS[make] ?? [];
}

export function getTrimsForModel(model: string): string[] {
  return VEHICLE_TRIMS[model] ?? [];
}

export function hasTrims(model: string): boolean {
  return (VEHICLE_TRIMS[model]?.length ?? 0) > 0;
}
