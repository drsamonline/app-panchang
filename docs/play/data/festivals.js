/* festivals.js — the observances, as rules rather than dates.
 *
 * Each entry is the classical definition: a lunar month (purnimanta, the
 * reckoning that makes Diwali "Kartik Amavasya"), a paksha, a tithi, and the
 * time of day the tithi is read — sunrise for most, pradosh (the first watch
 * of the night) for the lamp festivals, midday for the two that are kept then.
 *
 * A table of dates would go stale; a rule can be checked against any printed
 * panchang, which is what a reader will do anyway. Every rule here reproduces
 * the conventional date for 2026 — that is how the list was chosen. Where a
 * tithi touches two days, tradition sometimes names the second; the app shows
 * the tithi's own window so the other day is visible rather than hidden.
 *
 * Part of the Forge system. PolyForm Noncommercial 1.0.0. (c) 2026 Dr Sohil Momin.
 */
(function (root) {
  "use strict";

  var RULES = [
    { name: "Vasant Panchami",  masa: "Magha",      paksha: "Shukla",  tithi: 5,  at: "noon" },
    { name: "Maha Shivratri",   masa: "Phalguna",   paksha: "Krishna", tithi: 14, at: "pradosh" },
    { name: "Holi",             masa: "Phalguna",   paksha: "Shukla",  tithi: 15, at: "noon" },
    { name: "Ram Navami",       masa: "Chaitra",    paksha: "Shukla",  tithi: 9,  at: "noon" },
    { name: "Guru Purnima",     masa: "Ashadha",    paksha: "Shukla",  tithi: 15, at: "noon" },
    { name: "Janmashtami",      masa: "Bhadrapada", paksha: "Krishna", tithi: 8,  at: "pradosh" },
    { name: "Ganesh Chaturthi", masa: "Bhadrapada", paksha: "Shukla",  tithi: 4,  at: "noon" },
    { name: "Navratri begins",  masa: "Ashwin",     paksha: "Shukla",  tithi: 1,  at: "noon" },
    { name: "Diwali",           masa: "Kartik",     paksha: "Krishna", tithi: 15, at: "pradosh" },
    { name: "Bhai Dooj",        masa: "Kartik",     paksha: "Shukla",  tithi: 2,  at: "noon" }
  ];

  if (typeof module === "object" && module.exports) module.exports = RULES;
  else root.PanchangFestivals = RULES;
})(typeof self !== "undefined" ? self : this);
