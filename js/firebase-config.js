window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCxI6zRZAIOQ0lVAUczlHT_wiRTRDaKTZ4",
  authDomain: "thalarion-69cd1.firebaseapp.com",
  projectId: "thalarion-69cd1",
  storageBucket: "thalarion-69cd1.firebasestorage.app",
  messagingSenderId: "137124275627",
  appId: "1:137124275627:web:1c8d0dbf4a37dd9dfe9eee"
};

/** Firebase Auth email for the DM account (Email/Password provider). */
window.THALARION_DM_AUTH_EMAIL = "dm@thalarion-69cd1.firebaseapp.com";

/** Synthetic player auth emails under the project domain. */
window.thalarionPlayerAuthEmail = function (playerId) {
  const id = String(playerId || "").replace(/[^a-z0-9_-]/gi, "").toLowerCase();
  return "player-" + id + "@thalarion-69cd1.firebaseapp.com";
};
