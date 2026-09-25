/* Thalarion – globaler Zustand – Phase 1.5 */

    var db = null;
    var worldUpdatedAt = 0;
    var mapUpdatedAt = 0;
    var mapPins = [];
    var mapBorders = [];
    var mapPinsUpdatedAt = 0;
    var writingPins = false;
    var placingPin = false;
    var pendingPin = null;
    var pendingPinEntryId = null;
    var selectedPinShape = 'landmark';
    var selectedPinFaction = 'neutral';
    var selectedPinTier = 'marker';
    var selectedPinVisibility = 'player';
    var selectedPinSessionFocus = false;
    var mapFilter = {
      factions: {},
      shapes: {},
      showBorders: true,
      sessionOnly: false,
      showDmSecrets: true
    };
    var drawingBorder = false;
    var borderDraft = [];
    var editingPinId = null;
    var editingBorderId = null;
    var editingBorderVertsId = null;
    var mapLongPressTimer = null;
    var mapLongPressPos = null;
    var mapScale = 1;
    var mapPanX = 0;
    var mapPanY = 0;
    var mapDrag = null;
    var mapViewMemo = null;
    var openedFromMap = false;
    var localStorageOk = true;
    var searchHitIndex = -1;
    var writingRemote = false;
    var writingMap = false;
    var storageAvailable = true;
    var cloudDiagLog = [];
    var entries = [];
    var currentIndex = null;
    var currentTitle = null;
    var isDM = false;
    var expandedCategories = {};
    var currentPage = 'map';
    var selectedHomeCat = null;
    var selectedCodexSection = 'all';
    var titleKingdomFilter = '';
    var dirty = false;
    var imageCache = {};
    var pendingEntryImage = null;
    var editorImageId = '';
    var viewImageToken = 0;
    var editorImageToken = 0;
    var ocrBusy = false;
    var ocrWorkerPromise = null;
    var sheetDirty = false;
    var playerAccounts = {};
    var npcAccounts = {};
    var dmNotes = '';
    var playersUpdatedAt = 0;
    var writingPlayers = false;
    var rosterCards = [];
    var rosterUpdatedAt = 0;
    var writingRoster = false;
    var combatTemplates = [];
    var templatesUpdatedAt = 0;
    var writingTemplates = false;
    var templatesPersistTimer = null;
    var editingKarteId = null;
    var currentPlayerId = null;
    var currentSheetOwner = null;
    var chatThreads = {};
    var chatUnsubs = {};
    var chatOpen = false;
    var chatActiveId = null;
    var writingChat = {};
    var veyrEntryEditing = false;
    var pendingVeyrImage = null;
    var veyrImageToken = 0;
    var playerFormMode = 'login';
    var combat = { round: 1, started: false, activeId: null, debuffTick: 'turn', turnAt: 0, combatants: [], removed: {}, log: [], logResetAt: 0, updatedAt: 0 };
    var writingCombat = false;
    var combatWriteQueued = false;
    var pendingCombatSnap = null;
    var combatPersistTimer = null;
    var soundPlayers = {};
    var soundFadeRafs = new Map();
    var soundLoopFx = {};
    var soundFxShots = [];
    var soundMusic = null;
    var soundPlayGen = 0;
    var soundTrackId = '';
    var soundLastAmbientId = '';
    var soundPaused = false;
    var soundVolAmb = 0.55;
    var soundVolFx = 0.7;
    var soundDuckUntil = 0;
    var soundUnlocked = false;
    var soundDockOpen = false;
    var diceTrayOpen = false;
    var diceAnimMode = 'on';
    var diceLog = [];
    var diceQueue = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 };
    var soundPickKind = 'ambiente';
    var soundGroupFilter = 'all';
    var soundFavorites = [];
    var soundUserClips = [];
    var kampfAimFrom = '';
    var kampfAimTo = '';
    var kampfAimTargets = [];
    var kampfAimEffect = '';
    var kampfPowerAction = null;
    var kampfPowerPhase = '';
    var kampfPowerRenderKey = '';
    var sheetPortraitId = '';
    var pendingSheetPortrait = null;
    var kartePortraitId = '';
    var pendingKartePortrait = null;
    var battle = { image: '', tokens: [], hazards: [], fogOn: false, fogReveals: [], ping: null, tokenSize: 48, gridSize: 1, gridFrac: 0, updatedAt: 0, mapUpdatedAt: 0, layoutAt: 0, removedTokens: {}, removedHazards: {}, removedFog: {} };
    var writingBattle = false;
    var battleWriteQueued = false;
    var pendingBattleSnap = null;
    var writingBattleMap = false;
    var battleGalleryMaps = [];
    var battleGalleryUpdatedAt = 0;
    var writingBattleGallery = false;
    var battlePersistTimer = null;
    var battleHazardMode = null;
    var battleMapTool = null;
    var battleDraft = [];
    var battleRulerFrom = null;
    var battleRulerTo = null;
    var battleRulerHover = null;
    var lastBattlePingAt = 0;
    var playersPersistTimer = null;
    var battleTokenDrag = null;
    var battleTokenDragMoved = false;
    var battleTokenSuppressClick = false;
    var battleScale = 1;
    var battlePanX = 0;
    var battlePanY = 0;
    var battlePan = null;
    var battleGridMetricsCache = null;
    var battleLinkPinnedId = '';
    var battleLinkHoverId = '';

    var dungeon = {
      image: '',
      tokens: [],
      fogOn: true,
      fogReveals: [],
      fogRadius: 9,
      tokenSize: 48,
      updatedAt: 0,
      mapUpdatedAt: 0,
      layoutAt: 0,
      removedTokens: {},
      removedFog: {}
    };
    var writingDungeon = false;
    var dungeonWriteQueued = false;
    var pendingDungeonSnap = null;
    var writingDungeonMap = false;
    var dungeonPersistTimer = null;
    var dungeonTokenDrag = null;
    var dungeonTokenDragMoved = false;
    var dungeonScale = 1;
    var dungeonPanX = 0;
    var dungeonPanY = 0;
    var dungeonPan = null;
    var dungeonPendingPortrait = null;
    var dungeonPlaceMode = false;

    var els = {
      sidebar: document.getElementById('sidebar'),
      homeView: document.getElementById('homeView'),
      homeCards: document.getElementById('homeCards'),
      viewer: document.getElementById('viewer'),
      editorView: document.getElementById('editorView'),
      mapView: document.getElementById('mapView'),
      entstehungView: document.getElementById('entstehungView'),
      entstehungText: document.getElementById('entstehungText'),
      dmButton: document.getElementById('dmButton'),
      loginOverlay: document.getElementById('loginOverlay'),
      loginForm: document.getElementById('loginForm'),
      dmUser: document.getElementById('dmUser'),
      dmPassword: document.getElementById('dmPassword'),
      loginError: document.getElementById('loginError'),
      toast: document.getElementById('toast'),
      title: document.getElementById('title'),
      type: document.getElementById('type'),
      visibility: document.getElementById('visibility'),
      content: document.getElementById('content'),
      editorHeading: document.getElementById('editorHeading'),
      playerToEdit: document.getElementById('playerToEdit'),
      navChronik: document.getElementById('navChronik'),
      navCodex: document.getElementById('navCodex'),
      dmMenuSitzung: document.getElementById('dmMenuSitzung'),
      navMap: document.getElementById('navMap'),
      navCharakter: document.getElementById('navCharakter'),
      navKampf: document.getElementById('navKampf'),
      navDungeon: document.getElementById('navDungeon'),
      charView: document.getElementById('charView'),
      kampfView: document.getElementById('kampfView'),
      dungeonView: document.getElementById('dungeonView'),
      sitzungView: document.getElementById('sitzungView')
    };
