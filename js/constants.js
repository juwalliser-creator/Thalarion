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
  codex: KOMPENDIUM_CATS,
  bestiarium: BESTIARIUM_CATS,
  glossar: GLOSSAR_CATS
};
var PAGE_HERO = {
  world: {
    seal: 'T',
    title: 'Thalarion',
    blurb: 'Öffne das Kompendium, das Bestiarium oder das Glossar.'
  },
  codex: {
    seal: 'T',
    title: 'Das Kompendium von Thalarion',
    blurb: 'Öffne eine Kategorie, um Reiche, Städte, Götter und Geheimnisse dieser Welt nachzuschlagen.'
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
var PIN_KINDS = [
  { id: 'ort', group: 'Allgemein', label: 'Ort', color: '#9a3333', shape: 'dot' },
  { id: 'elf_city', group: 'Elfen', label: 'Elfenstadt', color: '#3d8c5a', shape: 'city' },
  { id: 'elf_outpost', group: 'Elfen', label: 'Elfenaußenposten', color: '#3d8c5a', shape: 'outpost' },
  { id: 'orc_city', group: 'Orks', label: 'Orksiedlung', color: '#8a3d1f', shape: 'city' },
  { id: 'orc_outpost', group: 'Orks', label: 'Orkaußenposten', color: '#8a3d1f', shape: 'outpost' },
  { id: 'human_city', group: 'Menschen', label: 'Menschenstadt', color: '#c4a35a', shape: 'city' },
  { id: 'human_outpost', group: 'Menschen', label: 'Menschenaußenposten', color: '#c4a35a', shape: 'outpost' },
  { id: 'dwarf_city', group: 'Zwerge', label: 'Zwergenstadt', color: '#b8860b', shape: 'city' },
  { id: 'dwarf_outpost', group: 'Zwerge', label: 'Zwergenaußenposten', color: '#b8860b', shape: 'outpost' },
  { id: 'battle', group: 'Kampf', label: 'Kampfstätte', color: '#9a3333', shape: 'battle' },
  { id: 'swords_hq', group: 'Religionen', label: 'Orden der Schwerter · Hauptsitz', color: '#d0d4dc', shape: 'hq' },
  { id: 'swords_outpost', group: 'Religionen', label: 'Orden der Schwerter · Außenposten', color: '#d0d4dc', shape: 'faith' },
  { id: 'lakunos_hq', group: 'Religionen', label: 'Lakunos · Hauptsitz', color: '#8a6aad', shape: 'hq' },
  { id: 'lakunos_outpost', group: 'Religionen', label: 'Lakunos · Außenposten', color: '#8a6aad', shape: 'faith' },
  { id: 'blood_hq', group: 'Religionen', label: 'Blutjünger · Hauptsitz', color: '#a32035', shape: 'hq' },
  { id: 'blood_outpost', group: 'Religionen', label: 'Blutjünger · Außenposten', color: '#a32035', shape: 'faith' },
  { id: 'night_hq', group: 'Religionen', label: 'Kinder der Nacht · Hauptsitz', color: '#4a5a9a', shape: 'hq' },
  { id: 'night_outpost', group: 'Religionen', label: 'Kinder der Nacht · Außenposten', color: '#4a5a9a', shape: 'faith' }
];
var SEARCH_GROUPS = [
  { page: 'entstehung', label: 'Entstehung' },
  { page: 'sitzung', label: 'Sitzung' },
  { page: 'codex', label: 'Kompendium' },
  { page: 'bestiarium', label: 'Bestiarium' },
  { page: 'glossar', label: 'Glossar' }
];
