export const VEHICLE_MAKES = [
  "Acura",
  "Alfa Romeo",
  "Audi",
  "BMW",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ferrari",
  "Fiat",
  "Ford",
  "Genesis",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jaguar",
  "Jeep",
  "Kia",
  "Lamborghini",
  "Land Rover",
  "Lexus",
  "Lincoln",
  "Maserati",
  "Mazda",
  "Mercedes-Benz",
  "MINI",
  "Mitsubishi",
  "Nissan",
  "Porsche",
  "RAM",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

export const VEHICLE_MODELS: Record<string, string[]> = {
  Acura: ["ILX", "MDX", "RDX", "RLX", "TLX"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale"],
  Audi: ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "e-tron", "TT"],
  BMW: ["Série 1", "Série 2", "Série 3", "Série 4", "Série 5", "Série 7", "X1", "X3", "X5", "X7", "iX", "i4"],
  Buick: ["Enclave", "Encore", "Encore GX", "Envision", "LaCrosse"],
  Cadillac: ["CT4", "CT5", "Escalade", "Lyriq", "XT4", "XT5", "XT6"],
  Chevrolet: ["Blazer", "Bolt EV", "Camaro", "Colorado", "Corvette", "Equinox", "Impala", "Malibu", "Silverado", "Spark", "Tahoe", "Trailblazer", "Traverse"],
  Chrysler: ["300", "Pacifica", "Voyager"],
  Dodge: ["Challenger", "Charger", "Durango", "Grand Caravan", "Hornet"],
  Ferrari: ["296 GTB", "F8", "Portofino", "Roma", "SF90"],
  Fiat: ["500", "500X"],
  Ford: ["Bronco", "Edge", "Escape", "Expedition", "Explorer", "F-150", "F-250", "F-350", "Fusion", "Maverick", "Mustang", "Mustang Mach-E", "Ranger", "Transit"],
  Genesis: ["G70", "G80", "G90", "GV70", "GV80"],
  GMC: ["Acadia", "Canyon", "Envoy", "Sierra", "Terrain", "Yukon"],
  Honda: ["Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Passport", "Pilot", "Ridgeline"],
  Hyundai: ["Elantra", "Ioniq 5", "Ioniq 6", "Kona", "Palisade", "Santa Cruz", "Santa Fe", "Sonata", "Tucson", "Venue"],
  Infiniti: ["Q50", "Q60", "QX50", "QX55", "QX60", "QX80"],
  Jaguar: ["E-Pace", "F-Pace", "F-Type", "I-Pace", "XE", "XF"],
  Jeep: ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wrangler"],
  Kia: ["Carnival", "EV6", "Forte", "K5", "Niro", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
  Lamborghini: ["Huracán", "Urus"],
  "Land Rover": ["Defender", "Discovery", "Range Rover", "Range Rover Sport", "Range Rover Velar"],
  Lexus: ["ES", "GX", "IS", "LC", "LS", "LX", "NX", "RX", "UX"],
  Lincoln: ["Aviator", "Corsair", "Nautilus", "Navigator"],
  Maserati: ["Ghibli", "Grecale", "Levante", "Quattroporte"],
  Mazda: ["CX-30", "CX-5", "CX-50", "CX-90", "Mazda3", "Mazda6", "MX-5 Miata"],
  "Mercedes-Benz": ["Classe A", "Classe C", "Classe E", "Classe S", "GLA", "GLB", "GLC", "GLE", "GLS", "EQS", "AMG GT"],
  MINI: ["Clubman", "Convertible", "Cooper", "Countryman", "Paceman"],
  Mitsubishi: ["Eclipse Cross", "Galant", "Outlander", "Outlander PHEV", "RVR"],
  Nissan: ["Altima", "Armada", "Kicks", "Leaf", "Maxima", "Murano", "Pathfinder", "Qashqai", "Rogue", "Sentra", "Titan", "Versa"],
  Porsche: ["718 Boxster", "718 Cayman", "911", "Cayenne", "Macan", "Panamera", "Taycan"],
  RAM: ["1500", "2500", "3500", "ProMaster"],
  Subaru: ["Ascent", "BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "Solterra", "WRX"],
  Tesla: ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y"],
  Toyota: ["4Runner", "Avalon", "Camry", "Corolla", "Crown", "GR86", "Highlander", "Land Cruiser", "Prius", "RAV4", "Sequoia", "Sienna", "Tacoma", "Tundra", "Venza"],
  Volkswagen: ["Atlas", "Golf", "ID.4", "Jetta", "Passat", "Taos", "Tiguan"],
  Volvo: ["C40 Recharge", "S60", "S90", "V60", "V90", "XC40", "XC60", "XC90"],
};

export function getYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear + 1; y >= 1990; y--) {
    years.push(y);
  }
  return years;
}

export function getModelsForMake(make: string): string[] {
  return VEHICLE_MODELS[make] ?? [];
}
