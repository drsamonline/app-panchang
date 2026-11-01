/* names.js — the almanac's words, in English, Hindi and Gujarati.
 *
 * The app's labels were translated but its *values* were not: the heading said
 * तिथि while the tithi still read "Krishna Saptami". These are the tables that
 * fix that. Sanskrit terms are transliterated into Devanagari and Gujarati.
 *
 * Samvatsara names are given in Latin only: they are transliterations of
 * Sanskrit and are printed that way in all three languages rather than guessed
 * at in two scripts.
 *
 * A missing Gujarati string falls back to Hindi, then English.
 * Part of the Forge system. PolyForm Noncommercial 1.0.0. (c) 2026 Dr Sohil Momin.
 */
(function (root) {
  "use strict";

  var N = {};

  N.tithi = {
    en: ["Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami",
      "Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima",
      "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami",
      "Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Amavasya"],
    hi: ["प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी","अष्टमी",
      "नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा",
      "प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी","अष्टमी",
      "नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"],
    gu: ["પ્રતિપદા","દ્વિતીયા","તૃતીયા","ચતુર્થી","પંચમી","ષષ્ઠી","સપ્તમી","અષ્ટમી",
      "નવમી","દશમી","એકાદશી","દ્વાદશી","ત્રયોદશી","ચતુર્દશી","પૂર્ણિમા",
      "પ્રતિપદા","દ્વિતીયા","તૃતીયા","ચતુર્થી","પંચમી","ષષ્ઠી","સપ્તમી","અષ્ટમી",
      "નવમી","દશમી","એકાદશી","દ્વાદશી","ત્રયોદશી","ચતુર્દશી","અમાવાસ્યા"]
  };

  N.nakshatra = {
    en: ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya",
      "Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha",
      "Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta",
      "Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"],
    hi: ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य",
      "आश्लेषा","मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी","हस्त","चित्रा","स्वाति","विशाखा",
      "अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा",
      "शतभिषा","पूर्वा भाद्रपद","उत्तरा भाद्रपद","रेवती"],
    gu: ["અશ્વિની","ભરણી","કૃત્તિકા","રોહિણી","મૃગશિરા","આર્દ્રા","પુનર્વસુ","પુષ્ય",
      "આશ્લેષા","મઘા","પૂર્વા ફાલ્ગુની","ઉત્તરા ફાલ્ગુની","હસ્ત","ચિત્રા","સ્વાતિ","વિશાખા",
      "અનુરાધા","જ્યેષ્ઠા","મૂળ","પૂર્વાષાઢા","ઉત્તરાષાઢા","શ્રવણ","ધનિષ્ઠા",
      "શતભિષા","પૂર્વા ભાદ્રપદ","ઉત્તરા ભાદ્રપદ","રેવતી"]
  };

  N.yoga = {
    en: ["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarman","Dhriti",
      "Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata",
      "Variyana","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"],
    hi: ["विष्कंभ","प्रीति","आयुष्मान","सौभाग्य","शोभन","अतिगंड","सुकर्मा","धृति",
      "शूल","गंड","वृद्धि","ध्रुव","व्याघात","हर्षण","वज्र","सिद्धि","व्यतिपात",
      "वरीयान","परिघ","शिव","सिद्ध","साध्य","शुभ","शुक्ल","ब्रह्म","इंद्र","वैधृति"],
    gu: ["વિષ્કંભ","પ્રીતિ","આયુષ્માન","સૌભાગ્ય","શોભન","અતિગંડ","સુકર્મા","ધૃતિ",
      "શૂળ","ગંડ","વૃદ્ધિ","ધ્રુવ","વ્યાઘાત","હર્ષણ","વજ્ર","સિદ્ધિ","વ્યતિપાત",
      "વરીયાન","પરિઘ","શિવ","સિદ્ધ","સાધ્ય","શુભ","શુક્લ","બ્રહ્મ","ઇન્દ્ર","વૈધૃતિ"]
  };

  /* keyed by name, because the karana table is not a simple cycle */
  N.karana = {
    en: {},
    hi: { "Kimstughna": "किंस्तुघ्न", "Bava": "बव", "Balava": "बालव", "Kaulava": "कौलव",
      "Taitila": "तैतिल", "Garaja": "गरज", "Vanija": "वणिज", "Vishti": "विष्टि",
      "Shakuni": "शकुनि", "Chatushpada": "चतुष्पद", "Naga": "नाग" },
    gu: { "Kimstughna": "કિંસ્તુઘ્ન", "Bava": "બવ", "Balava": "બાલવ", "Kaulava": "કૌલવ",
      "Taitila": "તૈતિલ", "Garaja": "ગરજ", "Vanija": "વણિજ", "Vishti": "વિષ્ટિ",
      "Shakuni": "શકુનિ", "Chatushpada": "ચતુષ્પદ", "Naga": "નાગ" }
  };

  N.vaara = {
    en: ["Ravivara","Somavara","Mangalavara","Budhavara","Guruvara","Shukravara","Shanivara"],
    hi: ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"],
    gu: ["રવિવાર","સોમવાર","મંગળવાર","બુધવાર","ગુરુવાર","શુક્રવાર","શનિવાર"]
  };

  N.masa = {
    en: ["Chaitra","Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada",
      "Ashwin","Kartik","Margashirsha","Pausha","Magha","Phalguna"],
    hi: ["चैत्र","वैशाख","ज्येष्ठ","आषाढ़","श्रावण","भाद्रपद",
      "आश्विन","कार्तिक","मार्गशीर्ष","पौष","माघ","फाल्गुन"],
    /* the Gujarati calendar keeps its own month names */
    gu: ["ચૈત્ર","વૈશાખ","જેઠ","આષાઢ","શ્રાવણ","ભાદરવો",
      "આસો","કારતક","માગશર","પોષ","મહા","ફાગણ"]
  };

  N.rashi = {
    en: ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrishchika",
      "Dhanu","Makara","Kumbha","Meena"],
    hi: ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"],
    gu: ["મેષ","વૃષભ","મિથુન","કર્ક","સિંહ","કન્યા","તુલા","વૃશ્ચિક","ધન","મકર","કુંભ","મીન"]
  };

  N.ritu = {
    en: ["Vasanta","Grishma","Varsha","Sharad","Hemanta","Shishira"],
    hi: ["वसंत","ग्रीष्म","वर्षा","शरद","हेमंत","शिशिर"],
    gu: ["વસંત","ગ્રીષ્મ","વર્ષા","શરદ","હેમંત","શિશિર"]
  };

  N.ayana = {
    en: ["Uttarayana", "Dakshinayana"],
    hi: ["उत्तरायण", "दक्षिणायन"],
    gu: ["ઉત્તરાયણ", "દક્ષિણાયન"]
  };

  N.paksha = {
    en: ["Shukla", "Krishna"],
    hi: ["शुक्ल", "कृष्ण"],
    gu: ["શુક્લ", "કૃષ્ણ"]
  };

  N.choghadiya = {
    en: ["Udveg","Char","Labh","Amrit","Kaal","Shubh","Rog"],
    hi: ["उद्वेग","चर","लाभ","अमृत","काल","शुभ","रोग"],
    gu: ["ઉદ્વેગ","ચર","લાભ","અમૃત","કાળ","શુભ","રોગ"]
  };

  N.hora = {
    en: ["Sun","Venus","Mercury","Moon","Saturn","Jupiter","Mars"],
    hi: ["सूर्य","शुक्र","बुध","चंद्र","शनि","गुरु","मंगल"],
    gu: ["સૂર્ય","શુક્ર","બુધ","ચંદ્ર","શનિ","ગુરુ","મંગળ"]
  };

  N.digits = {
    en: ["0","1","2","3","4","5","6","7","8","9"],
    hi: ["०","१","२","३","४","५","६","७","८","९"],
    gu: ["૦","૧","૨","૩","૪","૫","૬","૭","૮","૯"]
  };

  /* --- lookup helpers ------------------------------------------------- */
  var FALLBACK = ["gu", "hi", "en"];

  function pick(lang, table) {
    if (!table) return null;
    if (table[lang]) return table[lang];
    for (var i = 0; i < FALLBACK.length; i++) if (table[FALLBACK[i]]) return table[FALLBACK[i]];
    return null;
  }

  /* the name of a tithi (0..29), nakshatra (0..26), yoga (0..26), vaara, masa,
     rashi, ritu, ayana, choghadiya or hora lord - by index */
  function byIndex(kind, index, lang) {
    var t = pick(lang, N[kind]);
    if (!t || index == null) return "";
    return t[((index % t.length) + t.length) % t.length];
  }

  /* karana is keyed by its English name */
  function karanaName(englishName, lang) {
    if (!englishName) return "";
    if (lang === "en" || !lang) return englishName;
    var t = N.karana[lang] || N.karana.hi;
    return (t && t[englishName]) || englishName;
  }

  /* Devanagari / Gujarati digits, if the reader asked for them */
  function numerals(text, lang) {
    var d = N.digits[lang];
    if (!d) return String(text);
    return String(text).replace(/[0-9]/g, function (c) { return d[+c]; });
  }

  N.byIndex = byIndex;
  N.karanaName = karanaName;
  N.numerals = numerals;
  N.pick = pick;

  if (typeof module === "object" && module.exports) module.exports = N;
  else root.PanchangNames = N;
})(typeof self !== "undefined" ? self : this);
