// Jaylinn Village – vaste gegevens: catalogus, levels, namen, mini-game inhoud.
window.JV = window.JV || {};

(function (JV) {
  JV.GRID = 20;
  JV.DAY_SECONDS = 720; // één dag-en-nachtcyclus = 12 minuten
  JV.START_COINS = 500;

  JV.SKINS = ['#F7DCC8', '#EDBE98', '#D9A273', '#B57A4C', '#8A5734', '#633C22', '#432716'];
  JV.HAIR_COLORS = ['#2A1A12', '#5B3219', '#8C5428', '#E2B65E', '#C2562B', '#ECA2C4'];
  JV.CLOTH_COLORS = ['#F28BA8', '#E2483D', '#F29B38', '#9B6FD6', '#3F7FD8', '#4DAA57', '#F4C842', '#33B7B0', '#F1E7D8', '#4A4A5A'];
  JV.PANTS_COLORS = ['#3B5B8C', '#7F9BCB', '#454552', '#8A6A4A', '#B98AD9', '#E8A0B8'];
  JV.HAIR_STYLES = [
    { id: 'kort', label: 'Kort' },
    { id: 'krul', label: 'Krullen' },
    { id: 'afro', label: 'Afro' },
    { id: 'lang', label: 'Lang' },
    { id: 'staart', label: 'Staart' },
    { id: 'vlechtjes', label: 'Staartjes' },
    { id: 'knot', label: 'Knot' },
    { id: 'hoofddoek', label: 'Hoofddoek' },
  ];

  // cat: weg | woning | werk | deco | eigen | natuur
  JV.CATALOG = {
    road: { name: 'Weg', cat: 'weg', w: 1, h: 1, price: 10, level: 1, icon: '🛣️' },
    tree: { name: 'Boom', cat: 'deco', w: 1, h: 1, price: 20, level: 1, icon: '🌳' },
    flowers: { name: 'Bloemperk', cat: 'deco', w: 1, h: 1, price: 30, level: 2, icon: '🌷' },
    bench: { name: 'Bankje', cat: 'deco', w: 1, h: 1, price: 40, level: 2, icon: '🪑' },
    lantern: { name: 'Lantaarn', cat: 'deco', w: 1, h: 1, price: 50, level: 4, icon: '🏮' },
    fountain: { name: 'Fontein', cat: 'deco', w: 2, h: 2, price: 800, level: 5, icon: '⛲' },
    house_small: { name: 'Rijtjeshuis', cat: 'woning', w: 2, h: 2, price: 300, level: 1, icon: '🏠', maxAdults: 2, maxKids: 2 },
    house_big: { name: 'Vrijstaand huis', cat: 'woning', w: 2, h: 2, price: 450, level: 3, icon: '🏡', maxAdults: 2, maxKids: 3 },
    super: { name: 'Supermarkt', cat: 'werk', w: 3, h: 3, price: 500, level: 1, icon: '🛒', slots: 2, game: 'super', mult: 1, jobs: ['Kassamedewerker', 'Vakkenvuller'] },
    restaurant: { name: 'Restaurant', cat: 'werk', w: 3, h: 3, price: 1200, level: 5, icon: '🍽️', slots: 3, game: 'restaurant', mult: 1.3, jobs: ['Kok', 'Ober', 'Kok'] },
    opvang: { name: 'Kinderopvang', cat: 'werk', w: 3, h: 3, price: 1000, level: 5, icon: '🧸', slots: 3, game: 'opvang', mult: 1.2, jobs: ['Pedagogisch medewerker', 'Leidster', 'Pedagogisch medewerker'], childSlots: 8 },
    playerhouse: { name: 'Jouw huis', cat: 'eigen', w: 2, h: 2, price: 0, level: 999, icon: '💖' },
    rock: { name: 'Rots', cat: 'natuur', w: 1, h: 1, price: 0, level: 999, clear: 5 },
    bush: { name: 'Struik', cat: 'natuur', w: 1, h: 1, price: 0, level: 999, clear: 5 },
  };
  JV.BRIDGE_PRICE = 30;

  JV.SHOP_TABS = [
    { id: 'weg', label: 'Wegen', icon: '🛣️' },
    { id: 'woning', label: 'Woningen', icon: '🏠' },
    { id: 'werk', label: 'Werk', icon: '🏪' },
    { id: 'deco', label: 'Versiering', icon: '🌳' },
  ];

  JV.xpForLevel = function (n) { return 30 * n * (n - 1); }; // XP nodig om level n te bereiken
  JV.levelFromXp = function (xp) { let n = 1; while (xp >= JV.xpForLevel(n + 1)) n++; return n; };

  JV.STARTER_HOUSES = [
    { id: 'roze', name: 'Roze huisje', wall: '#FBE3D6', roof: '#E8708A', trim: '#FFFFFF' },
    { id: 'blauw', name: 'Blauw huis', wall: '#E3EEF8', roof: '#4E7FC4', trim: '#FFFFFF' },
    { id: 'groen', name: 'Groen huis', wall: '#F5EBD3', roof: '#5FA35A', trim: '#FFF8E8' },
  ];
  JV.HOUSE_WALLS = ['#FBE3D6', '#E3EEF8', '#F5EBD3', '#F3E1F2', '#E5F2E0', '#FFF0C9', '#F0E2D2'];
  JV.HOUSE_ROOFS = ['#E8708A', '#4E7FC4', '#5FA35A', '#9B6FD6', '#D9604A', '#7A5A44', '#E0A43A'];

  JV.SURNAMES = ['Jansen', 'De Vries', 'Moreno', 'Karim', 'Smit', 'Okafor', 'Van Leeuwen', 'Nguyen', 'Rodriguez', 'Bakker',
    'Peterson', 'Hendriks', 'Jatu', 'Verhoeven', 'Maas', 'Bos', 'De Graaf', 'Kok', 'Abdullah', 'Willems', 'Santos', 'Yilmaz',
    'Mensah', 'Visser', 'Patel', 'De Boer', 'Mulder', 'Haddad', 'Kowalski', 'Dekker', 'Tan', 'Brouwer', 'Ramdin', 'Van Dijk',
    'Achterberg', 'Osei', 'Meijer', 'Lopes', 'El Amrani', 'Schouten', 'Kim', 'Vos', 'Baptiste', 'Postma', 'Ali'];
  JV.NAMES_M = ['Daan', 'Milan', 'Youssef', 'Lucas', 'Mark', 'Finn', 'Sem', 'Noah', 'Amir', 'Zayn', 'Gabriel', 'Leo', 'Omar',
    'Jayden', 'Kofi', 'Mees', 'Thijs', 'Bram', 'Luca', 'Mohammed', 'Adam', 'Emre', 'Tim', 'Ravi', 'Jesse', 'Ibrahim', 'Liam',
    'Hugo', 'Mateo', 'Kenji', 'Kwame', 'Ruben', 'Samir', 'Joep', 'Diego'];
  JV.NAMES_V = ['Lotte', 'Fay', 'Noor', 'Aaliyah', 'Lina', 'Emma', 'Sophie', 'Tess', 'Isabella', 'Mia', 'Fatima', 'Sara',
    'Julia', 'Yara', 'Amara', 'Zoë', 'Nina', 'Lieke', 'Elif', 'Priya', 'Maryam', 'Eva', 'Saar', 'Anna', 'Lily', 'Ayla',
    'Chloé', 'Imani', 'Mila', 'Rosa', 'Esmée', 'Nadia', 'Femke', 'Ama', 'Hanna'];
  JV.PETS = [
    { id: 'hond', name: 'Hond', icon: '🐶' },
    { id: 'kat', name: 'Kat', icon: '🐱' },
    { id: 'konijn', name: 'Konijn', icon: '🐰' },
    { id: 'hamster', name: 'Hamster', icon: '🐹' },
    { id: 'vogel', name: 'Vogel', icon: '🐦' },
    { id: 'schildpad', name: 'Schildpad', icon: '🐢' },
  ];
  JV.AGE_LABEL = { volw: 'Volwassene', tiener: 'Tiener', kind: 'Schoolkind', peuter: 'Peuter', baby: 'Baby' };

  JV.PRODUCTS = [
    { id: 'appel', e: '🍎', n: 'Appel' }, { id: 'banaan', e: '🍌', n: 'Banaan' }, { id: 'melk', e: '🥛', n: 'Melk' },
    { id: 'brood', e: '🍞', n: 'Brood' }, { id: 'kaas', e: '🧀', n: 'Kaas' }, { id: 'ei', e: '🥚', n: 'Ei' },
    { id: 'wortel', e: '🥕', n: 'Wortel' }, { id: 'tomaat', e: '🍅', n: 'Tomaat' }, { id: 'peer', e: '🍐', n: 'Peer' },
    { id: 'koekje', e: '🍪', n: 'Koekje' }, { id: 'vis', e: '🐟', n: 'Vis' }, { id: 'druiven', e: '🍇', n: 'Druiven' },
    { id: 'aardbei', e: '🍓', n: 'Aardbei' }, { id: 'sap', e: '🧃', n: 'Sap' }, { id: 'broccoli', e: '🥦', n: 'Broccoli' },
  ];

  JV.INGREDIENTS = [
    { id: 'brood', e: '🍞', n: 'Brood' }, { id: 'tomaat', e: '🍅', n: 'Tomaat' }, { id: 'kaas', e: '🧀', n: 'Kaas' },
    { id: 'sla', e: '🥬', n: 'Sla' }, { id: 'vlees', e: '🥩', n: 'Vlees' }, { id: 'wortel', e: '🥕', n: 'Wortel' },
    { id: 'ei', e: '🥚', n: 'Ei' }, { id: 'rijst', e: '🍚', n: 'Rijst' }, { id: 'kip', e: '🍗', n: 'Kip' },
  ];
  JV.DISHES = [
    { id: 'burger', e: '🍔', n: 'Hamburger', parts: ['brood', 'vlees', 'sla'] },
    { id: 'tosti', e: '🥪', n: 'Tosti', parts: ['brood', 'kaas'] },
    { id: 'salade', e: '🥗', n: 'Salade', parts: ['sla', 'tomaat', 'wortel'] },
    { id: 'soep', e: '🍲', n: 'Soep', parts: ['tomaat', 'wortel'] },
    { id: 'rijst', e: '🍛', n: 'Rijst met kip', parts: ['rijst', 'kip'] },
    { id: 'omelet', e: '🍳', n: 'Omelet', parts: ['ei', 'kaas'] },
    { id: 'pizza', e: '🍕', n: 'Pizza', parts: ['brood', 'tomaat', 'kaas'] },
  ];

  JV.NEEDS = [
    { id: 'eten', e: '🍎', n: 'Eten', say: 'Ik heb honger!' },
    { id: 'drinken', e: '🍼', n: 'Drinken', say: 'Ik heb dorst!' },
    { id: 'spelen', e: '🧸', n: 'Spelen', say: 'Ik wil spelen!' },
    { id: 'slapen', e: '🛏️', n: 'Slapen', say: 'Ik ben moe…' },
    { id: 'verschonen', e: '🧷', n: 'Verschonen', say: 'Luier vol!' },
  ];

  JV.STAR_COINS = [40, 70, 100];
  JV.STAR_XP = [10, 20, 30];
})(window.JV);
