/* Thalarion – gemeinsame Konstanten (Phase 1.2) */
var STORY_CAT = 'Entstehung';
var SESSION_CAT = 'Updates';
var KOMPENDIUM_CATS = ['Königreiche','Städte','Landschaften','NPCs','Götter','Religionen','Gilden','Magische Orte','Titel & Ämter'];
var BESTIARIUM_CATS = ['Hochfänge','Niederfänge','Dunkelwesen','Dunkelpflanzen','Tiere','Monster','Drachen','Humanoiden','Magische Wesen','Geister'];
var GLOSSAR_CATS = ['Begriffe','Heilpflanzen','Gegenstände','Sprachen','Feste & Rituale'];
var TITLE_OFFICE_CAT = 'Titel & Ämter';
var KINGDOM_CAT = 'Königreiche';
var PAGE_CATS = {
  entstehung: [STORY_CAT],
  sitzung: [SESSION_CAT],
  chronik: [STORY_CAT, SESSION_CAT],
  codex: KOMPENDIUM_CATS.concat(BESTIARIUM_CATS, GLOSSAR_CATS),
  bestiarium: BESTIARIUM_CATS,
  glossar: GLOSSAR_CATS
};
var CODEX_SECTIONS = [
  { id: 'all', label: 'Alles', cats: null, seal: 'T', title: 'Der Codex von Thalarion', blurb: 'Wähle ein Tor — Kompendium, Bestiarium oder Glossar.' },
  { id: 'kompendium', label: 'Kompendium', cats: KOMPENDIUM_CATS, seal: 'K', title: 'Das Kompendium', blurb: 'Reiche, Städte, Götter und die Mächte, die Thalarion formen.' },
  { id: 'bestiarium', label: 'Bestiarium', cats: BESTIARIUM_CATS, seal: 'B', title: 'Das Bestiarium', blurb: 'Kreaturen, Schrecken und Wesen zwischen Licht und Dunkelheit.' },
  { id: 'glossar', label: 'Glossar', cats: GLOSSAR_CATS, seal: 'G', title: 'Das Glossar', blurb: 'Namen, Stoffe und Worte, die man kennen sollte.' }
];
var CODEX_GATES = CODEX_SECTIONS.filter(s => s.id !== 'all');
var PAGE_HERO = {
  chronik: {
    seal: 'C',
    title: 'Die Chronik von Thalarion',
    blurb: 'Lies, wie die Welt entstand — und was in den letzten Sitzungen geschah.'
  },
  world: {
    seal: 'T',
    title: 'Thalarion',
    blurb: 'Öffne den Codex oder die Chronik.'
  },
  codex: {
    seal: 'T',
    title: 'Der Codex von Thalarion',
    blurb: 'Wähle ein Tor — Kompendium, Bestiarium oder Glossar.'
  },
  bestiarium: {
    seal: 'B',
    title: 'Das Bestiarium von Thalarion',
    blurb: 'Öffne eine Kategorie, um Tiere, Monster und andere Wesen dieser Welt nachzuschlagen.'
  },
  glossar: {
    seal: 'G',
    title: 'Das Glossar von Thalarion',
    blurb: 'Öffne eine Kategorie, um Namen, Heilpflanzen und andere Fachworte dieser Welt nachzuschlagen.'
  },
  sitzung: {
    seal: 'S',
    title: 'Letzte Sitzung',
    blurb: 'Was in Thalarion zuletzt geschah.'
  }
};
var categories = [STORY_CAT, SESSION_CAT].concat(KOMPENDIUM_CATS, BESTIARIUM_CATS, GLOSSAR_CATS);
var typeAliases = { Stadt: 'Städte', Königreich: 'Königreiche', Landschaft: 'Landschaften', Gott: 'Götter', Religion: 'Religionen', Gilde: 'Gilden', Magie: 'Heilpflanzen', Nutzpflanzen: 'Heilpflanzen', Bestien: 'Tiere' };
var LOCAL_KEY = 'thalarion_world_data';
var SESSION_KEY = 'thalarion_dm';
var VIEW_KEY = 'thalarion_view';
var WORLD_DOC = 'codex';
var PLAYERS_DOC = 'players';
var ROSTER_DOC = 'kampfKarten';
var TEMPLATES_DOC = 'kampfVorlagen';
var ROSTER_LOCAL_KEY = 'thalarion_kampf_karten';
var BATTLE_DOC = 'kampfFeld';
var BATTLE_MAP_DOC = 'kampfFeldMap';
var BATTLE_GALLERY_DOC = 'kampfFeldGalerie';
var COMBAT_DOC = 'kampfStand';
var DICE_LOG_DOC = 'wurfProtokoll';
var BATTLE_LOCAL_KEY = 'thalarion_kampf_feld';
var BATTLE_GALLERY_LOCAL_KEY = 'thalarion_kampf_galerie';
var DUNGEON_DOC = 'dungeon';
var DUNGEON_MAP_DOC = 'dungeonMap';
var DUNGEON_LOCAL_KEY = 'thalarion_dungeon';
var DUNGEON_MAP_LOCAL_KEY = 'thalarion_dungeon_map';
var BATTLE_HAZARDS = {
  fire: { label: 'Feuer', fill: 'rgba(180, 48, 22, 0.42)', stroke: '#e07040' },
  water: { label: 'Wasser', fill: 'rgba(46, 92, 170, 0.38)', stroke: '#6aa8e0' },
  oil: { label: 'Öl', fill: 'rgba(42, 32, 12, 0.5)', stroke: '#c4a35a' }
};
var DM_USER = 'dm';
var DM_PASS = 'bWVpbmV3ZWx0';
var PLAYER_SESSION_KEY = 'thalarion_player';
var COMBAT_KEY = 'thalarion_combat';
var COMBAT_TEMPLATES_KEY = 'thalarion_combat_templates';
var COMBAT_DEBUFF_SUGGEST = ['Liegend', 'Vergiftet', 'Verängstigt', 'Festgehalten'];
var COMBAT_BUFF_SUGGEST = ['Gesegnet', 'Unsichtbar', 'Vorteil', 'Schild', 'Konzentration'];
var EMPTY_SHEET = {
  name: '',
  volk: '',
  klasse: '',
  stufe: '',
  hp: '',
  armor: '',
  stats: 'ST — GE — KO — IN — WE — CH',
  notes: '',
  extra: '',
  portraitId: ''
};
var OLD_SHEET_MARK = '<b>Name:</b>';
var SOUND_VOL_KEY = 'thalarion_sound_vol';
var SOUND_PREF_KEY = 'thalarion_sound_prefs';
var DICE_PREF_KEY = 'thalarion_dice_anim';
var SOUND_FADE_IN = 1600;
var SOUND_FADE_OUT = 1400;
var SOUND_CROSSFADE = 5000;
var SOUND_FAV_MAX = 6;
var SOUND_GROUPS = [
  { id: 'reise', name: 'Reise' },
  { id: 'taverne', name: 'Taverne' },
  { id: 'kerker', name: 'Kerker' },
  { id: 'kampf', name: 'Kampf' }
];
var SOUND_TRACKS = {
  reise: { name: 'Reisemusik', src: 'audio/reise/reisemusik.mp3', group: 'reise' },
  kampf: { name: 'Kampfmusik', src: 'audio/kampf/kampfmusik.mp3', group: 'kampf' }
};
var SOUND_FX = [
  { id: 'etwas-brennt', name: 'etwas brennt', src: 'audio/fx/etwas-brennt.mp3', loop: true },
  { id: 'daemonenstimme', name: 'Dämonenstimme', src: 'audio/fx/daemonenstimme.mp3', loop: false }
];
var YUVI_ID = 'yuvi';
var VEYR_ALT = 'veyr';
var VEYR_OWNER = YUVI_ID + ':' + VEYR_ALT;
var CHRIS_ID = 'chris';
var ILLUSION_ALT = 'illusion';
var ILLUSION_OWNER = CHRIS_ID + ':' + ILLUSION_ALT;
var DM_NOTES_OWNER = 'dm-notes';
var NPC_PREFIX = 'npc:';
var DND_ABS = [
  { id: 'str', label: 'Stärke', short: 'STÄ' },
  { id: 'dex', label: 'Geschicklichkeit', short: 'GES' },
  { id: 'con', label: 'Konstitution', short: 'KON' },
  { id: 'int', label: 'Intelligenz', short: 'INT' },
  { id: 'wis', label: 'Weisheit', short: 'WEI' },
  { id: 'cha', label: 'Charisma', short: 'CHA' }
];
var DND_SKILLS = [
  { id: 'athletics', ability: 'str', label: 'Athletik' },
  { id: 'acrobatics', ability: 'dex', label: 'Akrobatik' },
  { id: 'sleight', ability: 'dex', label: 'Fingerfertigkeit' },
  { id: 'stealth', ability: 'dex', label: 'Heimlichkeit' },
  { id: 'arcana', ability: 'int', label: 'Arkanum' },
  { id: 'history', ability: 'int', label: 'Geschichte' },
  { id: 'investigation', ability: 'int', label: 'Nachforschungen' },
  { id: 'nature', ability: 'int', label: 'Naturkunde' },
  { id: 'religion', ability: 'int', label: 'Religion' },
  { id: 'animal', ability: 'wis', label: 'Mit Tieren umgehen' },
  { id: 'insight', ability: 'wis', label: 'Motiv erkennen' },
  { id: 'medicine', ability: 'wis', label: 'Heilkunde' },
  { id: 'perception', ability: 'wis', label: 'Wahrnehmung' },
  { id: 'survival', ability: 'wis', label: 'Überlebenskunst' },
  { id: 'deception', ability: 'cha', label: 'Täuschen' },
  { id: 'intimidation', ability: 'cha', label: 'Einschüchtern' },
  { id: 'performance', ability: 'cha', label: 'Auftreten' },
  { id: 'persuasion', ability: 'cha', label: 'Überzeugen' }
];
var DICE_TRAY_SIDES = [4, 6, 8, 10, 12, 20, 100];
var MAP_PIN_CORE = '#14110e';
var MAP_PIN_EDGE = '#e0c27a';
var MAP_SHAPES = [
  { id: 'settlement', label: 'Siedlung', group: 'Typen' },
  { id: 'outpost', label: 'Außenposten', group: 'Typen' },
  { id: 'landmark', label: 'Landmarke', group: 'Typen' },
  { id: 'temple', label: 'Heiligtum', group: 'Typen' },
  { id: 'hq', label: 'Hauptsitz', group: 'Typen' },
  { id: 'ruin', label: 'Ruine', group: 'Typen' },
  { id: 'danger', label: 'Gefahr/Kampf', group: 'Typen' },
  { id: 'harbor', label: 'Hafen', group: 'Typen' },
  { id: 'mine', label: 'Mine', group: 'Typen' },
  { id: 'magic', label: 'Magischer Ort', group: 'Typen' },
  { id: 'camp', label: 'Lager', group: 'Typen' }
];
var MAP_FACTIONS = [
  { id: 'neutral', label: 'Neutral', group: 'Völker', color: '#9a3333' },
  { id: 'elf', label: 'Elfen', group: 'Völker', color: '#3d8c5a' },
  { id: 'orc', label: 'Orks', group: 'Völker', color: '#8a3d1f' },
  { id: 'human', label: 'Menschen', group: 'Völker', color: '#c4a35a' },
  { id: 'dwarf', label: 'Zwerge', group: 'Völker', color: '#b8860b' },
  { id: 'swords', label: 'Orden der Schwerter', group: 'Orden', color: '#d0d4dc' },
  { id: 'lakunos', label: 'Lakunos', group: 'Orden', color: '#8a6aad' },
  { id: 'blood', label: 'Blutjünger', group: 'Orden', color: '#a32035' },
  { id: 'night', label: 'Kinder der Nacht', group: 'Orden', color: '#4a5a9a' },
  { id: 'unknown', label: 'Unbekannt / DM', group: 'Völker', color: '#6a655c' }
];
var MAP_TIERS = [
  { id: 'major', label: 'Groß', scale: 1 },
  { id: 'minor', label: 'Normal', scale: 0.78 },
  { id: 'marker', label: 'Klein', scale: 0.62 }
];
var MAP_ORDER_FACTIONS = ['swords', 'lakunos', 'blood', 'night'];
var MAP_RACE_FACTIONS = ['elf', 'orc', 'human', 'dwarf'];
var PIN_KIND_MIGRATE = {
  ort: { shape: 'landmark', faction: 'neutral', tier: 'marker' },
  elf_city: { shape: 'settlement', faction: 'elf', tier: 'minor' },
  elf_outpost: { shape: 'outpost', faction: 'elf', tier: 'minor' },
  orc_city: { shape: 'settlement', faction: 'orc', tier: 'minor' },
  orc_outpost: { shape: 'outpost', faction: 'orc', tier: 'minor' },
  human_city: { shape: 'settlement', faction: 'human', tier: 'minor' },
  human_outpost: { shape: 'outpost', faction: 'human', tier: 'minor' },
  dwarf_city: { shape: 'settlement', faction: 'dwarf', tier: 'minor' },
  dwarf_outpost: { shape: 'outpost', faction: 'dwarf', tier: 'minor' },
  battle: { shape: 'danger', faction: 'neutral', tier: 'marker' },
  swords_hq: { shape: 'hq', faction: 'swords', tier: 'major' },
  swords_outpost: { shape: 'temple', faction: 'swords', tier: 'minor' },
  lakunos_hq: { shape: 'hq', faction: 'lakunos', tier: 'major' },
  lakunos_outpost: { shape: 'temple', faction: 'lakunos', tier: 'minor' },
  blood_hq: { shape: 'hq', faction: 'blood', tier: 'major' },
  blood_outpost: { shape: 'temple', faction: 'blood', tier: 'minor' },
  night_hq: { shape: 'hq', faction: 'night', tier: 'major' },
  night_outpost: { shape: 'temple', faction: 'night', tier: 'minor' }
};
var SEARCH_GROUPS = [
  { page: 'entstehung', label: 'Chronik · Entstehung' },
  { page: 'sitzung', label: 'Chronik · Sitzung' },
  { page: 'codex', label: 'Codex · Kompendium', section: 'kompendium' },
  { page: 'bestiarium', label: 'Codex · Bestiarium', section: 'bestiarium' },
  { page: 'glossar', label: 'Codex · Glossar', section: 'glossar' }
];
