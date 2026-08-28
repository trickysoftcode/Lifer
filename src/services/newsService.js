const RSS_FEEDS = {
  politics: 'https://news.google.com/rss/search?q=India+politics&hl=en-IN&gl=IN&ceid=IN:en',
  technology: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pKVGlnQVAB?hl=en-IN&gl=IN&ceid=IN:en',
  cinema: 'https://news.google.com/rss/search?q=India+cinema+Bollywood&hl=en-IN&gl=IN&ceid=IN:en'
};

const buildApiUrl = (category) => {
  return `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_FEEDS[category])}`;
};

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const fetchNewsByCategory = async (category) => {
  const cacheKey = `lifer_news_${category}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      const parsedCache = JSON.parse(cached);
      const isExpired = Date.now() - parsedCache.timestamp > CACHE_TTL;
      
      if (!isExpired) {
        return { data: parsedCache.data, isOffline: false };
      }
    } catch (e) {
      console.warn('Invalid cache data', e);
    }
  }

  try {
    const response = await fetch(buildApiUrl(category));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    
    if (result.status !== 'ok') {
      throw new Error('API returned non-ok status');
    }

    const data = result.items.slice(0, 10).map(item => ({
      title: item.title,
      link: item.link,
      source: item.author || 'Google News',
      pubDate: item.pubDate,
      description: item.description || item.content || '',
    }));

    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data
    }));

    return { data, isOffline: false };
  } catch (error) {
    console.error('Failed to fetch news:', error);
    
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        return { data: parsedCache.data, isOffline: true };
      } catch (e) {
        // Fallback if cache is corrupt
      }
    }
    
    return { data: [], isOffline: true, error: error.message };
  }
};

const recommendations = {
  politics: [
    { title: "India After Gandhi", author: "Ramachandra Guha", description: "A comprehensive history of the world's largest democracy.", emoji: "🇮🇳" },
    { title: "The Discovery of India", author: "Jawaharlal Nehru", description: "Written in prison, covering India's rich history.", emoji: "📜" },
    { title: "India's Struggle for Independence", author: "Bipan Chandra", description: "Detailed account of the Indian independence movement.", emoji: "✊" },
    { title: "Why I Am a Hindu", author: "Shashi Tharoor", description: "An exploration of Hinduism and its philosophy.", emoji: "🕉️" }
  ],
  technology: [
    { title: "The Innovators", author: "Walter Isaacson", description: "How a group of hackers, geniuses, and geeks created the digital revolution.", emoji: "💡" },
    { title: "The Code Book", author: "Simon Singh", description: "The science of secrecy from ancient Egypt to quantum cryptography.", emoji: "🔐" },
    { title: "Hackers & Painters", author: "Paul Graham", description: "Big ideas from the computer age.", emoji: "🎨" },
    { title: "The Soul of a New Machine", author: "Tracy Kidder", description: "The dramatic story of a computer engineering team.", emoji: "💻" }
  ],
  cinema: [
    { title: "An Autobiography", author: "Satyajit Ray", description: "Life and works of the legendary Indian filmmaker.", emoji: "🎥" },
    { title: "Easy Riders, Raging Bulls", author: "Peter Biskind", description: "How the sex-drugs-and-rock 'n' roll generation saved Hollywood.", emoji: "🎬" },
    { title: "Bollywood: A History", author: "Mihir Bose", description: "The colorful history of India's biggest film industry.", emoji: "🍿" },
    { title: "The Cinema of India", author: "Various Authors", description: "Essays on regional and national Indian cinema.", emoji: "🎞️" }
  ]
};

export const getReadingRecommendations = (category) => {
  return recommendations[category] || [];
};

const trivia = {
  politics: [
    "India has the largest postal network in the world with over 1,55,015 post offices.",
    "The Constitution of India is the longest written constitution of any sovereign country in the world.",
    "The first general elections in India were held in 1951-52.",
    "B.R. Ambedkar is known as the 'Father of the Indian Constitution'.",
    "Electronic Voting Machines (EVMs) were first used in Kerala in 1982.",
    "The Parliament of India consists of the President, the Lok Sabha, and the Rajya Sabha.",
    "India is the world's largest democracy by population.",
    "The Election Commission of India operates as an autonomous constitutional authority.",
    "The President of India is the supreme commander of the Indian Armed Forces.",
    "Panchayati Raj is the system of local self-government of villages in rural India."
  ],
  technology: [
    "The first computer mouse was invented by Doug Engelbart around 1964 and was made of wood.",
    "The first domain name ever registered was Symbolics.com on March 15, 1985.",
    "The first mobile phone call was made on April 3, 1973, by Martin Cooper of Motorola.",
    "The QWERTY keyboard was designed to slow down typing to prevent mechanical typewriter jams.",
    "The first 1GB hard drive was announced by IBM in 1980, it weighed about 500 pounds and cost $40,000.",
    "The word 'robot' comes from the Czech word 'robota' which translates to forced labor or work.",
    "The first web browser was invented in 1990 by Sir Tim Berners-Lee and was called WorldWideWeb.",
    "The Apple Lisa was the first commercial personal computer to have a graphical user interface (GUI) and a mouse.",
    "The term 'bug' for a computer glitch was popularized by Grace Hopper in 1947.",
    "Wi-Fi doesn't stand for anything, it was created as a catchier name for the IEEE 802.11b Direct Sequence standard."
  ],
  cinema: [
    "Raja Harishchandra, released in 1913, was the first full-length Indian feature film.",
    "Alam Ara (1931) was the first Indian sound film.",
    "Bollywood produces over 1,000 films every year, making it the largest film industry in the world by number of films produced.",
    "The Lord of the Rings: The Return of the King holds the record for the most Oscar wins (11) without a single loss.",
    "Alfred Hitchcock was nominated for Best Director at the Oscars five times but never won.",
    "The longest movie ever made is 'Logistics' which is 857 hours (35 days and 17 hours) long.",
    "Marlon Brando rejected his Best Actor Oscar for The Godfather to protest Hollywood's treatment of Native Americans.",
    "Charlie Chaplin lived in Switzerland for the last 25 years of his life.",
    "The first feature-length animated movie was Snow White and the Seven Dwarfs (1937).",
    "Dilwale Dulhania Le Jayenge is the longest-running film in Indian cinema history."
  ]
};

export const getRandomTrivia = (category) => {
  const categoryTrivia = trivia[category] || [];
  if (categoryTrivia.length === 0) return "";
  const randomIndex = Math.floor(Math.random() * categoryTrivia.length);
  return categoryTrivia[randomIndex];
};
