export type MouthShape =
  | "wide-open"
  | "mid-open-spread"
  | "close-spread"
  | "mid-open-round"
  | "close-round"
  | "mid-neutral"
  | "closed"
  | "teeth-lip"
  | "tongue-between"
  | "sibilant"
  | "sh-forward"
  | "h-open";

export interface IpaSound {
  id: string;
  symbol: string;
  category: string;
  word: string;
  soundPhrase: string; // short phrase to practise the sound in isolation
  examples: string[];  // 20 example words for this sound
  hint: string;
  mouthShape: MouthShape;
}

export const CATEGORY_LABELS: Record<string, string> = {
  "Short Vowels":  "Nguyên âm ngắn",
  "Long Vowels":   "Nguyên âm dài",
  "Diphthongs":    "Nguyên âm đôi",
  "Stops":         "Phụ âm tắc",
  "Fricatives":    "Phụ âm xát",
  "Affricates":    "Phụ âm tắc-xát",
  "Nasals":        "Phụ âm mũi",
  "Approximants":  "Bán nguyên âm",
};

export const SOUNDS: IpaSound[] = [
  // Short Vowels
  {
    id: "i", symbol: "/ɪ/", category: "Short Vowels", word: "bit", soundPhrase: "ih", mouthShape: "close-spread",
    examples: ["bit", "sit", "hit", "tip", "lip", "ship", "chip", "grip", "trip", "slim", "swim", "click", "trick", "still", "fill", "drill", "thrill", "brick", "quick", "spin"],
    hint: "Ngắn và thư giãn. Miệng hé nhỏ, khóe môi kéo nhẹ ra hai bên. Lưỡi ở vị trí cao-trước nhưng không căng.",
  },
  {
    id: "e", symbol: "/e/", category: "Short Vowels", word: "bed", soundPhrase: "eh", mouthShape: "mid-open-spread",
    examples: ["bed", "red", "set", "get", "step", "bell", "fell", "sell", "spell", "help", "belt", "left", "best", "rest", "test", "next", "chest", "press", "dress", "blend"],
    hint: "Miệng mở vừa phải. Răng hé ra, môi kéo nhẹ hai bên. Lưỡi ở vị trí trước-giữa.",
  },
  {
    id: "ae", symbol: "/æ/", category: "Short Vowels", word: "cat", soundPhrase: "aah", mouthShape: "wide-open",
    examples: ["cat", "bat", "hat", "map", "tap", "bag", "flag", "black", "back", "pack", "crash", "flash", "grab", "snap", "plan", "glad", "flat", "slap", "wrap", "clad"],
    hint: "Hàm dưới mở rộng nhất trong các nguyên âm ngắn. Môi kéo ngang, răng cả hai hàm đều thấy. Lưỡi thấp và đẩy về phía trước.",
  },
  {
    id: "uh", symbol: "/ʌ/", category: "Short Vowels", word: "cup", soundPhrase: "uh", mouthShape: "mid-neutral",
    examples: ["cup", "bus", "run", "sun", "fun", "gun", "cut", "hut", "love", "come", "some", "done", "month", "touch", "young", "above", "enough", "rough", "tough", "blood"],
    hint: "Miệng mở vừa, môi hoàn toàn thư giãn — không tròn, không kéo ngang. Lưỡi ở giữa miệng, vị trí trung tính.",
  },
  {
    id: "o", symbol: "/ɒ/", category: "Short Vowels", word: "hot", soundPhrase: "oh", mouthShape: "mid-open-round",
    examples: ["hot", "pot", "lot", "box", "fox", "job", "top", "stop", "drop", "shop", "block", "clock", "stock", "knock", "lock", "cop", "chop", "mop", "rob", "pod"],
    hint: "Hàm mở rộng, môi hơi tròn nhẹ. Lưỡi thấp và kéo về phía sau. Âm này ngắn và không căng.",
  },
  {
    id: "oo", symbol: "/ʊ/", category: "Short Vowels", word: "book", soundPhrase: "oo", mouthShape: "close-round",
    examples: ["book", "cook", "look", "hook", "good", "wood", "foot", "could", "would", "should", "pull", "push", "full", "put", "bull", "wolf", "soot", "stood", "brook", "crook"],
    hint: "Ngắn, miệng gần khép, môi tròn nhẹ và đẩy ra trước nhưng không căng. Lưỡi cao-sau nhưng thư giãn.",
  },
  {
    id: "schwa", symbol: "/ə/", category: "Short Vowels", word: "about", soundPhrase: "a", mouthShape: "mid-neutral",
    examples: ["about", "above", "across", "agree", "ago", "again", "alone", "among", "appear", "around", "away", "below", "between", "because", "before", "behind", "beside", "upon", "along", "afford"],
    hint: "Âm trung tính — miệng hé vừa phải, môi hoàn toàn thư giãn, lưỡi không đẩy về đâu cả. Đây là âm phổ biến nhất trong tiếng Anh.",
  },

  // Long Vowels
  {
    id: "ee", symbol: "/iː/", category: "Long Vowels", word: "bee", soundPhrase: "eee", mouthShape: "close-spread",
    examples: ["bee", "see", "tree", "free", "feel", "meal", "keep", "sleep", "week", "feet", "meet", "heat", "east", "beach", "teach", "speak", "reach", "peach", "stream", "dream"],
    hint: "Dài và căng. Miệng gần khép, khóe môi kéo rộng như đang cười. Đầu lưỡi sát sau răng cửa dưới, phần giữa lưỡi vồng cao.",
  },
  {
    id: "aa", symbol: "/ɑː/", category: "Long Vowels", word: "car", soundPhrase: "aah", mouthShape: "wide-open",
    examples: ["car", "bar", "far", "star", "hard", "park", "dark", "arm", "farm", "heart", "start", "chart", "smart", "guard", "sharp", "march", "path", "bath", "staff", "laugh"],
    hint: "Dài. Hàm dưới thả xuống thấp nhất, miệng mở rất rộng. Môi thư giãn, không tròn không kéo. Lưỡi thấp và kéo ra sau.",
  },
  {
    id: "aw", symbol: "/ɔː/", category: "Long Vowels", word: "more", soundPhrase: "aw", mouthShape: "mid-open-round",
    examples: ["more", "door", "floor", "store", "born", "corn", "fork", "form", "sport", "sort", "court", "short", "horse", "four", "war", "raw", "jaw", "draw", "cause", "board"],
    hint: "Dài. Miệng mở vừa, môi tròn và đẩy nhẹ ra trước. Lưỡi ở vị trí sau-giữa. Hơi giống âm \"ô\" trong tiếng Việt nhưng dài hơn.",
  },
  {
    id: "oo-long", symbol: "/uː/", category: "Long Vowels", word: "blue", soundPhrase: "ooo", mouthShape: "close-round",
    examples: ["blue", "true", "new", "clue", "food", "pool", "cool", "tool", "room", "moon", "noon", "soon", "move", "smooth", "cruise", "juice", "fruit", "truth", "youth", "proof"],
    hint: "Dài và căng. Miệng gần khép, môi tròn và đẩy mạnh ra trước. Lưỡi cao và kéo ra sau.",
  },
  {
    id: "er", symbol: "/ɜː/", category: "Long Vowels", word: "bird", soundPhrase: "er", mouthShape: "mid-neutral",
    examples: ["bird", "girl", "first", "shirt", "skirt", "third", "word", "work", "hurt", "turn", "burn", "learn", "earn", "search", "heard", "serve", "nurse", "worse", "curve", "firm"],
    hint: "Dài. Miệng mở vừa, môi không tròn, không kéo ngang — trung tính hoàn toàn. Lưỡi ở giữa miệng. Không có âm tương đương trong tiếng Việt.",
  },

  // Diphthongs
  {
    id: "ay", symbol: "/eɪ/", category: "Diphthongs", word: "day", soundPhrase: "ay", mouthShape: "mid-open-spread",
    examples: ["day", "say", "way", "pay", "play", "stay", "male", "tale", "cake", "make", "name", "same", "place", "race", "face", "grace", "chase", "taste", "brave", "wave"],
    hint: "Trượt từ /e/ → /ɪ/. Bắt đầu miệng mở vừa, môi kéo nhẹ, rồi trượt lên miệng gần khép. Âm đầu /e/ giữ lâu hơn.",
  },
  {
    id: "eye", symbol: "/aɪ/", category: "Diphthongs", word: "my", soundPhrase: "aye", mouthShape: "wide-open",
    examples: ["my", "fly", "sky", "try", "cry", "dry", "high", "night", "light", "right", "time", "mine", "line", "fine", "wide", "side", "tide", "ride", "slide", "pride"],
    hint: "Trượt từ /æ/ → /ɪ/. Bắt đầu mở miệng rất rộng, rồi trượt lên miệng gần khép, môi kéo ngang.",
  },
  {
    id: "oy", symbol: "/ɔɪ/", category: "Diphthongs", word: "boy", soundPhrase: "oy", mouthShape: "mid-open-round",
    examples: ["boy", "toy", "joy", "oil", "foil", "coin", "join", "point", "voice", "choice", "noise", "enjoy", "avoid", "moist", "loyal", "royal", "void", "toil", "spoil", "annoy"],
    hint: "Trượt từ /ɔ/ → /ɪ/. Bắt đầu môi tròn miệng mở vừa, rồi trượt sang môi kéo ngang miệng gần khép.",
  },
  {
    id: "ow", symbol: "/aʊ/", category: "Diphthongs", word: "how", soundPhrase: "ow", mouthShape: "wide-open",
    examples: ["how", "now", "cow", "out", "loud", "cloud", "round", "found", "ground", "sound", "mouth", "house", "town", "brown", "crown", "power", "tower", "flower", "shower", "count"],
    hint: "Trượt từ /æ/ → /ʊ/. Bắt đầu mở miệng rất rộng, rồi trượt sang môi tròn miệng gần khép.",
  },
  {
    id: "oh", symbol: "/əʊ/", category: "Diphthongs", word: "go", soundPhrase: "oh", mouthShape: "mid-neutral",
    examples: ["go", "no", "so", "low", "blow", "flow", "show", "snow", "know", "grow", "road", "code", "note", "home", "phone", "stone", "bone", "close", "whole", "alone"],
    hint: "Trượt từ /ə/ → /ʊ/. Bắt đầu miệng thư giãn trung tính, rồi trượt sang môi tròn miệng gần khép.",
  },
  {
    id: "ear", symbol: "/ɪə/", category: "Diphthongs", word: "ear", soundPhrase: "ear", mouthShape: "close-spread",
    examples: ["ear", "near", "dear", "fear", "hear", "year", "clear", "beer", "cheer", "here", "appear", "career", "sincere", "real", "feel", "deal", "steel", "wheel", "field", "pier"],
    hint: "Trượt từ /ɪ/ → /ə/. Bắt đầu miệng gần khép, môi kéo nhẹ, rồi trượt sang trung tính thư giãn.",
  },
  {
    id: "air", symbol: "/eə/", category: "Diphthongs", word: "air", soundPhrase: "air", mouthShape: "mid-open-spread",
    examples: ["air", "hair", "fair", "pair", "bear", "wear", "care", "dare", "rare", "share", "stare", "there", "where", "chair", "spare", "compare", "aware", "repair", "square", "prepare"],
    hint: "Trượt từ /e/ → /ə/. Bắt đầu miệng mở vừa, rồi trượt sang trung tính.",
  },
  {
    id: "ure", symbol: "/ʊə/", category: "Diphthongs", word: "pure", soundPhrase: "ure", mouthShape: "close-round",
    examples: ["pure", "cure", "sure", "poor", "lure", "during", "jury", "fury", "rural", "bureau", "mature", "endure", "secure", "allure", "assure", "tour", "moor", "fewer", "newer", "truer"],
    hint: "Trượt từ /ʊ/ → /ə/. Bắt đầu môi tròn, rồi trượt sang trung tính thư giãn.",
  },

  // Stops
  {
    id: "p", symbol: "/p/", category: "Stops", word: "pay", soundPhrase: "pa", mouthShape: "closed",
    examples: ["pay", "pie", "pin", "park", "pace", "pain", "pan", "pass", "peace", "peak", "pink", "pipe", "plan", "play", "plus", "point", "price", "prime", "proud", "push"],
    hint: "Khép hai môi lại, giữ hơi tạo áp suất, rồi bật ra một hơi ngắn. Không rung dây thanh (vô thanh). Đặt tay trước miệng — sẽ cảm nhận được hơi bật ra.",
  },
  {
    id: "b", symbol: "/b/", category: "Stops", word: "bay", soundPhrase: "ba", mouthShape: "closed",
    examples: ["bay", "bee", "big", "ball", "band", "base", "beat", "bell", "bike", "bite", "black", "blade", "blue", "bold", "bone", "book", "boom", "brave", "break", "bright"],
    hint: "Giống /p/ — khép hai môi, tạo áp suất rồi bật ra — nhưng có rung dây thanh (hữu thanh). Đặt tay lên cổ họng để cảm nhận sự rung.",
  },
  {
    id: "t", symbol: "/t/", category: "Stops", word: "tea", soundPhrase: "ta", mouthShape: "sibilant",
    examples: ["tea", "tie", "top", "take", "talk", "taste", "teach", "time", "tip", "tone", "tool", "touch", "town", "track", "train", "tree", "trick", "trust", "turn", "type"],
    hint: "Đầu lưỡi chạm vào lợi răng (alveolar ridge) — chỗ phình lên ngay sau răng cửa trên. Giữ hơi rồi bật ra. Vô thanh.",
  },
  {
    id: "d", symbol: "/d/", category: "Stops", word: "day", soundPhrase: "da", mouthShape: "sibilant",
    examples: ["day", "die", "door", "dark", "date", "dead", "deal", "dear", "deep", "dive", "dock", "drag", "draw", "drop", "drum", "duck", "dull", "dust", "dare", "dash"],
    hint: "Giống /t/ — đầu lưỡi chạm lợi răng, bật ra — nhưng có rung dây thanh (hữu thanh). Đặt tay lên cổ để cảm nhận sự rung.",
  },
  {
    id: "k", symbol: "/k/", category: "Stops", word: "key", soundPhrase: "ka", mouthShape: "h-open",
    examples: ["key", "car", "coat", "cool", "come", "case", "cake", "call", "camp", "care", "cause", "cave", "clean", "close", "coin", "kind", "king", "know", "crew", "cry"],
    hint: "Gốc lưỡi (phần sau) chặn vòm miệng mềm. Giữ hơi rồi bật ra ở phía sau họng. Vô thanh.",
  },
  {
    id: "g", symbol: "/g/", category: "Stops", word: "go", soundPhrase: "ga", mouthShape: "h-open",
    examples: ["go", "give", "get", "game", "goal", "good", "grab", "grade", "grand", "great", "green", "grip", "grow", "guard", "guide", "gun", "gap", "glue", "glow", "grace"],
    hint: "Giống /k/ — gốc lưỡi chặn vòm mềm — nhưng có rung dây thanh. Cảm nhận âm thanh ở sâu trong họng.",
  },

  // Fricatives
  {
    id: "f", symbol: "/f/", category: "Fricatives", word: "fee", soundPhrase: "fa", mouthShape: "teeth-lip",
    examples: ["fee", "fly", "face", "fact", "fall", "fame", "farm", "fast", "fear", "feel", "field", "fight", "fill", "fine", "fire", "fish", "five", "flag", "flat", "floor"],
    hint: "Răng cửa trên đặt nhẹ lên môi dưới. Thổi hơi qua khe hẹp đó tạo âm ma sát. Vô thanh. Rất khác /ph/ trong tiếng Việt.",
  },
  {
    id: "v", symbol: "/v/", category: "Fricatives", word: "vine", soundPhrase: "va", mouthShape: "teeth-lip",
    examples: ["vine", "van", "veil", "vest", "view", "voice", "vote", "value", "vast", "verb", "very", "video", "visit", "vital", "vivid", "vocal", "void", "voyage", "valve", "valid"],
    hint: "Giống /f/ — răng trên lên môi dưới — nhưng có rung dây thanh. Hữu thanh. Tiếng Việt không có âm này.",
  },
  {
    id: "th-v", symbol: "/θ/", category: "Fricatives", word: "thin", soundPhrase: "three", mouthShape: "tongue-between",
    examples: ["thin", "three", "think", "thank", "through", "throw", "thought", "throat", "thumb", "thigh", "thick", "thief", "thirst", "thorn", "throne", "thunder", "theme", "thread", "thrust", "thatch"],
    hint: "Đầu lưỡi kẹp nhẹ giữa hai hàng răng (hoặc chạm mặt sau răng cửa trên), thổi hơi qua. Vô thanh. Ví dụ: \"think\", \"three\", \"bath\".",
  },
  {
    id: "th", symbol: "/ð/", category: "Fricatives", word: "they", soundPhrase: "the", mouthShape: "tongue-between",
    examples: ["they", "this", "that", "these", "those", "then", "there", "father", "mother", "brother", "other", "rather", "whether", "weather", "together", "another", "feather", "leather", "smooth", "further"],
    hint: "Giống /θ/ — đầu lưỡi giữa răng — nhưng có rung dây thanh. Hữu thanh. Ví dụ: \"the\", \"this\", \"that\", \"mother\".",
  },
  {
    id: "s", symbol: "/s/", category: "Fricatives", word: "see", soundPhrase: "say", mouthShape: "sibilant",
    examples: ["see", "sit", "say", "set", "safe", "seal", "seem", "send", "side", "sign", "sing", "sink", "slip", "smart", "smile", "smoke", "snow", "soft", "sort", "speak"],
    hint: "Răng hai hàm gần khép. Đầu lưỡi gần lợi, thổi hơi qua khe hẹp tạo âm rít cao. Vô thanh. Đây là âm /s/ quen thuộc.",
  },
  {
    id: "z", symbol: "/z/", category: "Fricatives", word: "zoo", soundPhrase: "zap", mouthShape: "sibilant",
    examples: ["zoo", "zero", "zone", "buzz", "jazz", "fizz", "days", "ways", "nose", "rose", "close", "please", "cheese", "freeze", "size", "prize", "rise", "wise", "breeze", "cause"],
    hint: "Giống /s/ — răng gần khép, hơi rít qua — nhưng có rung dây thanh. Hữu thanh. Ít gặp trong tiếng Việt.",
  },
  {
    id: "sh", symbol: "/ʃ/", category: "Fricatives", word: "she", soundPhrase: "shaw", mouthShape: "sh-forward",
    examples: ["she", "show", "shop", "ship", "share", "shape", "sheet", "shelf", "shine", "shirt", "shoe", "shoot", "short", "shout", "shut", "shake", "shift", "sharp", "shell", "shall"],
    hint: "Môi đẩy nhẹ ra trước. Lưỡi lui về sau hơn /s/, thổi hơi qua khe rộng hơn tạo âm \"xì\" trầm. Vô thanh. Nghe như \"shhhh\" khi ru ngủ.",
  },
  {
    id: "zh", symbol: "/ʒ/", category: "Fricatives", word: "vision", soundPhrase: "measure", mouthShape: "sh-forward",
    examples: ["vision", "measure", "treasure", "pleasure", "leisure", "usual", "casual", "visual", "decision", "confusion", "invasion", "revision", "division", "television", "occasion", "fusion", "illusion", "explosion", "version", "persuasion"],
    hint: "Giống /ʃ/ nhưng có rung dây thanh. Hữu thanh. Ít phổ biến, hay gặp ở giữa từ: \"vision\", \"measure\", \"pleasure\".",
  },
  {
    id: "h", symbol: "/h/", category: "Fricatives", word: "hey", soundPhrase: "ha", mouthShape: "h-open",
    examples: ["hey", "hi", "hat", "have", "hand", "hard", "hate", "head", "hear", "heart", "heat", "heavy", "help", "hide", "high", "hill", "hit", "hold", "home", "hope"],
    hint: "Miệng mở theo hình của nguyên âm liền sau. Thở hơi ra nhẹ từ cổ họng, không có cấu âm đặc biệt ở môi hay lưỡi. Cổ họng hơi mở rộng.",
  },

  // Affricates
  {
    id: "ch", symbol: "/tʃ/", category: "Affricates", word: "cheer", soundPhrase: "chew", mouthShape: "sh-forward",
    examples: ["cheer", "chair", "check", "chest", "child", "choice", "choose", "church", "chalk", "change", "charm", "chase", "cheap", "chief", "chill", "chin", "chip", "chop", "chunk", "charge"],
    hint: "Kết hợp /t/ + /ʃ/. Đầu lưỡi chạm lợi răng để cản hơi, rồi thả ra như âm /ʃ/. Môi đẩy nhẹ ra trước. Vô thanh.",
  },
  {
    id: "j", symbol: "/dʒ/", category: "Affricates", word: "joy", soundPhrase: "jay", mouthShape: "sh-forward",
    examples: ["joy", "job", "jaw", "jump", "just", "jam", "jet", "jog", "juice", "judge", "page", "age", "cage", "stage", "bridge", "badge", "edge", "hedge", "lodge", "huge"],
    hint: "Kết hợp /d/ + /ʒ/. Giống /tʃ/ nhưng có rung dây thanh. Hữu thanh. Ví dụ: \"jump\", \"bridge\", \"age\".",
  },

  // Nasals
  {
    id: "m", symbol: "/m/", category: "Nasals", word: "me", soundPhrase: "ma", mouthShape: "closed",
    examples: ["me", "make", "mark", "match", "mean", "meet", "milk", "mind", "mix", "moon", "more", "most", "move", "much", "name", "game", "flame", "blame", "dream", "claim"],
    hint: "Khép hai môi lại (giống /p/, /b/). Hơi thoát ra qua đường mũi. Rung dây thanh. Âm mũi — giống âm /m/ trong tiếng Việt.",
  },
  {
    id: "n", symbol: "/n/", category: "Nasals", word: "knee", soundPhrase: "na", mouthShape: "sibilant",
    examples: ["knee", "new", "need", "near", "neck", "next", "night", "nine", "note", "nice", "nail", "nerve", "news", "noon", "north", "nurse", "nut", "now", "know", "name"],
    hint: "Đầu lưỡi chạm lợi răng (giống /t/, /d/). Hơi thoát ra qua đường mũi. Rung dây thanh. Âm mũi — giống /n/ tiếng Việt.",
  },
  {
    id: "ng", symbol: "/ŋ/", category: "Nasals", word: "sing", soundPhrase: "ring", mouthShape: "h-open",
    examples: ["sing", "ring", "king", "wing", "spring", "string", "bring", "thing", "hang", "gang", "song", "long", "strong", "wrong", "lung", "rung", "hung", "among", "along", "young"],
    hint: "Gốc lưỡi chặn vòm mềm (giống /k/, /g/). Hơi thoát qua mũi. Rung dây thanh. Âm mũi — giống cuối từ \"răng\", \"bằng\" trong tiếng Việt.",
  },

  // Approximants
  {
    id: "l", symbol: "/l/", category: "Approximants", word: "lay", soundPhrase: "la", mouthShape: "sibilant",
    examples: ["lay", "law", "lake", "land", "last", "late", "learn", "left", "life", "like", "line", "list", "live", "lock", "long", "look", "love", "low", "luck", "laugh"],
    hint: "Đầu lưỡi chạm lợi răng, hơi thoát ra hai bên lưỡi. Rung dây thanh. Giống /l/ tiếng Việt nhưng người Anh đôi khi phát âm \"dark L\" ở cuối từ (lưỡi cong ra sau).",
  },
  {
    id: "r", symbol: "/r/", category: "Approximants", word: "red", soundPhrase: "ra", mouthShape: "sh-forward",
    examples: ["red", "run", "race", "rain", "reach", "read", "rice", "ride", "right", "rise", "road", "rock", "roof", "rope", "rose", "rough", "rule", "rush", "rest", "rich"],
    hint: "Môi hơi tròn và đẩy ra trước. Đầu lưỡi cong ra sau nhưng không chạm vào đâu cả. Rung dây thanh. Rất khác /r/ trong tiếng Việt — không rung cuống lưỡi.",
  },
  {
    id: "j-approx", symbol: "/j/", category: "Approximants", word: "yes", soundPhrase: "ya", mouthShape: "close-spread",
    examples: ["yes", "you", "year", "yet", "yard", "yell", "young", "youth", "yellow", "yesterday", "yeast", "yoga", "yield", "yawn", "yarn", "yearn", "yummy", "yelp", "yoke", "yonder"],
    hint: "Bắt đầu ở vị trí gần như /iː/ (miệng gần khép, kéo ngang), rồi lướt nhanh sang nguyên âm kế tiếp. Rung dây thanh.",
  },
  {
    id: "w", symbol: "/w/", category: "Approximants", word: "way", soundPhrase: "wa", mouthShape: "close-round",
    examples: ["way", "war", "wait", "walk", "wall", "want", "warm", "wash", "watch", "wave", "weak", "west", "wide", "will", "wind", "wish", "wolf", "wood", "work", "world"],
    hint: "Bắt đầu ở vị trí gần như /uː/ (môi tròn mạnh, đẩy ra trước), rồi lướt nhanh sang nguyên âm kế tiếp. Rung dây thanh.",
  },
];

export const CATEGORIES = [...new Set(SOUNDS.map((s) => s.category))];
