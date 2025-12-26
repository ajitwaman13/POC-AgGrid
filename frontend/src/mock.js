// mock.js
const makes = [
  "Tesla",
  "Ford",
  "Toyota",
  "Honda",
  "BMW",
  "Audi",
  "Mercedes",
  "Hyundai",
  "Nissan",
  "Chevrolet",
];
const models = {
  Tesla: ["Model Y", "Model 3", "Model S", "Model X", "Cybertruck"],
  Ford: ["F-Series", "Mustang", "Explorer", "Escape", "Mach-E"],
  Toyota: ["Corolla", "Camry", "RAV4", "Prius", "Highlander"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "Odyssey"],
  BMW: ["i4", "M3", "X5", "3 Series", "i7"],
  Audi: ["A4", "Q5", "e-tron", "A6", "Q7"],
  Mercedes: ["EQS", "C-Class", "GLC", "E-Class", "S-Class"],
  Hyundai: ["Ioniq 5", "Elantra", "Tucson", "Santa Fe", "Kona"],
  Nissan: ["Leaf", "Altima", "Rogue", "Pathfinder", "Sentra"],
  Chevrolet: ["Silverado", "Bolt", "Malibu", "Equinox", "Tahoe"],
};

const brandOrigin = {
  Tesla: "USA",
  Ford: "USA",
  Chevrolet: "USA",
  Toyota: "Japan",
  Honda: "Japan",
  Nissan: "Japan",
  BMW: "Germany",
  Audi: "Germany",
  Mercedes: "Germany",
  Hyundai: "South Korea",
};
const colors = ["Red", "Blue", "Black", "White", "Silver", "Grey", "Green"];
const fuelTypes = ["Gasoline", "Electric", "Hybrid", "Diesel"];
const transmissions = ["Automatic", "Manual", "CVT"];

export const generateMockData = (count = 1000) => {
  return Array.from({ length: count }, (_, index) => {
    const make = makes[Math.floor(Math.random() * makes.length)];
    const model = models[make][Math.floor(Math.random() * models[make].length)];

    return {
      id: index + 1,
      make: makes,
      model: model,
      country: brandOrigin[make],
      year: Math.floor(Math.random() * (2025 - 2015 + 1)) + 2015,
      price: Math.floor(Math.random() * 80000) + 20000,
      electric:
        make === "Tesla" ||
        ["Leaf", "Bolt", "Ioniq 5", "e-tron"].includes(model),
      color: colors[Math.floor(Math.random() * colors.length)],
      fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
      transmission:
        transmissions[Math.floor(Math.random() * transmissions.length)],
      mileage: Math.floor(Math.random() * 100000),
      vin: Math.random().toString(36).substring(2, 12).toUpperCase(),
      engineSize: (Math.random() * (5.0 - 1.2) + 1.2).toFixed(1) + "L",
      doorCount: Math.random() > 0.3 ? 4 : 2,
      ownerName: "User_" + (index + 1),
      location: "City_" + (index % 50),
      warranty: Math.random() > 0.5 ? "Active" : "Expired",
      isInsured: Math.random() > 0.2,
      safetyRating: Math.floor(Math.random() * 5) + 1 + "/5",
      phone: Math.floor(100000 + Math.random() * 900000),
    };
  });
};

export const mockRowData = generateMockData(5000);
