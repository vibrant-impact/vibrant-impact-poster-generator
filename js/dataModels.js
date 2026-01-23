
const VIBRANT_API = {}; 
window.VIBRANT_API = VIBRANT_API;

// --- 1. Utility Constants and Data ---
const CURATED_FONTS = [
    "Roboto", "Open Sans", "Lato", "Montserrat", "Comfortaa", "Varela Round", "MuseoModerno", 
    "Genos", "Play", "Smooch Sans", "NTR", "Proza Libre", "Chango", "Bubblegum Sans", 
    "Titan One", "Ultra", "Sigmar", "Paytone One", "Coiny", "Gravitas One", "Barriecito", 
    "Chewy", "Playfair Display", "Cormorant Upright", "Quando", "Gabriela", "Averia Serif Libre", 
    "Aref Ruqaa", "Josefin Sans", "Oldenburg", "Mitr", "Germania One", "Rye", "Peralta", 
    "Great Vibes", "Parisienne", "Tangerine", "Alex Brush", "Montez", "Italianno", 
    "Berkshire Swash", "Sevillana", "Engagement", "Dr Sugiyama", "Playball", "Charm", 
    "Grechen Fuemen", "Pacifico", "Playwrite NO", "Playwrite CA", "Marck Script", 
    "Shadows Into Light", "Annie Use Your Telescope", "The Girl Next Door", "Nothing You Could Do", 
    "Twinkle Star", "Gloria Hallelujah", "Calligraffitti", "Limelight", "Flamenco", 
    "Fascinate", "Amarante", "Fonteinen Swanky", "Nosifier", "Sirivennela", "Zhi Mang Xing", 
    "Emilys Candy", "Ribeye Marrow", "Unkempt", "Happy Monkey", "Mystery Quest", "Rum Raisin", 
    "Sour Gummy", "Griffy", "Dela Gothic One", "Rubik Wet Paint", "Londrina Shadow", "Risque", 
    "Creepster", "Metal Mania", "Iceland", "Spiral", "Snowburst One", "UnifrakturCook", 
    "Lacquer", "Climate Crisis", "Google Sans Code", "Orbitron", "Quantico", "Audiowide", 
    "Tektur", "Geo", "Tourney", "Bruno Ace SC", "Rampart One", "Codystar", "Faster One", 
    "Stalemate", "Life Savers"
];

const QUOTE_TAGS = [
    'Change', 'Choice', 'Confidence', 'Courage', 'Dreams', 'Excellence', 
    'Fairness', 'Forgiveness', 'Freedom', 'Future', 'Happiness', 'Inspiration', 
    'Kindness', 'Leadership', 'Life', 'Living', 'Love', 'Past', 'Success', 'Time', 
    'Today', 'Truth', 'Work', 'Anxiety', 'Death', 'Fear', 'Pain', 'Failure' 
];

// --- 2. Data Classes ---
class Quote {
    constructor(quoteText, authorName, htmlRepresentation = null) {
      this.quoteText = quoteText; 
      this.authorName = authorName; 
      this.htmlRepresentation = htmlRepresentation;
    }
    static fromJson(json) {
      return new Quote(json.q || json.quoteText, json.a || json.authorName, json.h);
    }
}
window.Quote = Quote;

class EmojiLayer {
    constructor(id, character, x, y, size, color, rotation) {
      this.id = id;
      this.character = character;
      this.x = x;
      this.y = y;
      this.size = size;
      this.color = color;
      this.rotation = rotation;
    }
}
window.EmojiLayer = EmojiLayer;

// --- 3. API Service Functions ---

// Fetch Quotes from Proxy
VIBRANT_API.fetchQuotes = async function(tag = 'Inspiration') {
  const url = `/api/fetch-quotes?tag=${encodeURIComponent(tag)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json(); 
    if (!Array.isArray(data) || data.length === 0) throw new Error("No quotes returned.");
    return data.map(json => Quote.fromJson(json));
  } catch (error) {
      console.warn(`Quote fetch failed: Using fallback.`, error);
      return [
            { q: "Design must reflect content.", a: "Anonymous" },
            { q: "Creativity takes courage.", a: "Henri Matisse" },
            { q: "Simplicity is the ultimate sophistication.", a: "Da Vinci" }
        ].map(json => Quote.fromJson(json)); 
    }
};

// Fetch Emojis from Proxy (API Ninjas)
VIBRANT_API.fetchEmojis = async function(query = '') {
  let searchTerm = query.toLowerCase().trim();
  const words = searchTerm.split(' ');
  searchTerm = words[words.length - 1]; 
  const synonyms = {
    "happy": "grinning", "excited": "star-struck",
    "frustrated": "pouting", "sad": "frowning",
    "cool": "sunglasses", "love": "heart",
    "party": "celebration"
  };

  if (synonyms[searchTerm]) {
     searchTerm = synonyms[searchTerm];
  }

  const url = `/api/fetch-emojis?query=${encodeURIComponent(searchTerm)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch emojis");
        
    const data = await response.json(); 
    if (!data || !Array.isArray(data)) return [];
        
    return data.map(e => ({ 
      character: e.character, 
      slug: e.name || 'emoji' 
    })); 
  } catch (error) {
      console.warn("Emoji fetch failed:", error);
      return []; 
    }
};

// Fetch Fonts
VIBRANT_API.fetchGoogleFonts = function() {
  return [...CURATED_FONTS].sort();
};

VIBRANT_API.loadFont = function(fontFamily) {
  if (!fontFamily) return;
  const linkId = `font-${fontFamily.replace(/\s+/g, '-')}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
    link.setAttribute('crossorigin', 'anonymous'); 
    document.head.appendChild(link);
  }
};

// Fetch Color Palette
VIBRANT_API.fetchColorPalette = async function() {
  const style = document.getElementById('paletteStyleSelect')?.value || 'vibrant';
  
  const hslToHex = (h, s, l) => {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = n => {
          const k = (n + h / 30) % 12;
          const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
          return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  };

  let s, l;
  switch (style) {
    case 'neon': s = 90; l = 50; break;
    case 'pastel': s = 50; l = 85; break;
    case 'professional': s = 40; l = 35; break;
    case 'earth': s = 30; l = 45; break;
    default: s = 75; l = 55;
  }

  const baseHue = Math.floor(Math.random() * 360);
  const harmonies = ['analogous', 'triadic', 'complementarySplit'];
  const mode = harmonies[Math.floor(Math.random() * harmonies.length)];
  
  let newPalette = [];
  if (mode === 'analogous') {
    newPalette = [baseHue, baseHue+15, baseHue+30, baseHue-15, baseHue-30]
      .map(h => hslToHex((h + 360) % 360, s, l));
  } else if (mode === 'triadic') {
    newPalette = [baseHue, baseHue+120, baseHue+240, baseHue, baseHue+120]
      .map((h, i) => hslToHex((h + 360) % 360, s, i > 2 ? l - 20 : l));
  } else {
    newPalette = [baseHue, baseHue+150, baseHue+210, baseHue, baseHue+180]
      .map((h, i) => hslToHex((h + 360) % 360, i === 4 ? 10 : s, i === 4 ? 95 : l));
  }
  newPalette.sort(() => Math.random() - 0.5);

  const currentLocks = window.lockedColors || [false, false, false, false, false];

  if (window.colorPalette && window.colorPalette.length === 5) {
    const finalPalette = window.colorPalette.map((oldColor, index) => {
        // Use currentLocks (the local variable) to avoid reference errors
        return currentLocks[index] ? oldColor : newPalette[index];
    });
    return finalPalette;
  }

  return newPalette;
};