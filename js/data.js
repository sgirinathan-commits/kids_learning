/* ============================================================
   Captain Leap - curriculum data
   Reading: systematic synthetic phonics progression (10 levels)
   Speaking: Colourful-Semantics picture talk, sentence frames,
             conversation with recasting, story sequencing.
   ============================================================ */

// How each phonics unit is SPOKEN by the text-to-speech voice.
// (Speech engines say letter NAMES, so we spell the SOUND instead.)
const SOUNDS = {
  // short vowels
  a: "ah", e: "eh", i: "ih", o: "aw", u: "uh",
  // long vowels (magic e / vowel teams)
  A: "ay", E: "ee", I: "eye", O: "oh", U: "you",
  // consonants
  b: "buh", c: "kuh", d: "duh", f: "fff", g: "guh", h: "huh", j: "juh",
  k: "kuh", l: "lll", m: "mmm", n: "nnn", p: "puh", q: "kwuh", r: "rrr",
  s: "sss", t: "tuh", v: "vvv", w: "wuh", x: "ks", y: "yuh", z: "zzz",
  // digraphs & doubles
  sh: "shh", ch: "chuh", th: "thh", ck: "kuh", ng: "ng", wh: "wuh", qu: "kwuh",
  ll: "lll", ss: "sss", ff: "fff", gg: "guh", zz: "zzz",
  // vowel teams
  ee: "ee", oo: "oo", ai: "ay", ay: "ay", oa: "oh", ea: "ee",
  // bossy r
  ar: "ar", or: "or", ir: "er", ur: "er", er: "er",
  // silent
  _: ""
};

// Word encoding: "c a:A k e:_"  ->  grapheme[:soundKey], "_" = silent
const READING_LEVELS = [
  { title: "Short a", tip: "a says 'ah' like in ant",
    words: [
      ["ant", "a n t", "🐜"], ["cat", "c a t", "🐱"], ["hat", "h a t", "🎩"],
      ["bat", "b a t", "🦇"], ["map", "m a p", "🗺️"], ["van", "v a n", "🚐"],
      ["pan", "p a n", "🍳"], ["bag", "b a g", "👜"], ["rat", "r a t", "🐀"],
      ["cap", "c a p", "🧢"] ] },
  { title: "Short e", tip: "e says 'eh' like in egg",
    words: [
      ["bed", "b e d", "🛏️"], ["hen", "h e n", "🐔"], ["net", "n e t", "🥅"],
      ["pen", "p e n", "🖊️"], ["web", "w e b", "🕸️"], ["jet", "j e t", "✈️"],
      ["leg", "l e g", "🦵"], ["ten", "t e n", "🔟"], ["egg", "e gg", "🥚"],
      ["red", "r e d", "🟥"] ] },
  { title: "Short i", tip: "i says 'ih' like in pig",
    words: [
      ["pig", "p i g", "🐷"], ["pin", "p i n", "📌"], ["lip", "l i p", "👄"],
      ["six", "s i x", "6️⃣"], ["kid", "k i d", "🧒"], ["zip", "z i p", "🤐"],
      ["bin", "b i n", "🗑️"], ["fin", "f i n", "🦈"], ["sit", "s i t", "🪑"],
      ["dig", "d i g", "⛏️"] ] },
  { title: "Short o", tip: "o says 'aw' like in dog",
    words: [
      ["dog", "d o g", "🐶"], ["pot", "p o t", "🍲"], ["box", "b o x", "📦"],
      ["fox", "f o x", "🦊"], ["log", "l o g", "🪵"], ["mop", "m o p", "🧹"],
      ["top", "t o p", "🔝"], ["hop", "h o p", "🐇"], ["dot", "d o t", "⚫"],
      ["hot", "h o t", "🔥"] ] },
  { title: "Short u", tip: "u says 'uh' like in sun",
    words: [
      ["sun", "s u n", "☀️"], ["bus", "b u s", "🚌"], ["cup", "c u p", "☕"],
      ["bug", "b u g", "🐛"], ["mud", "m u d", "🟤"], ["nut", "n u t", "🥜"],
      ["hug", "h u g", "🤗"], ["gum", "g u m", "🍬"], ["tub", "t u b", "🛁"],
      ["pup", "p u p", "🐶"] ] },
  { title: "sh ch th ck", tip: "Two letters can make ONE sound!",
    words: [
      ["ship", "sh i p", "🚢"], ["fish", "f i sh", "🐟"], ["shell", "sh e ll", "🐚"],
      ["chick", "ch i ck", "🐥"], ["chip", "ch i p", "🍟"], ["bath", "b a th", "🛁"],
      ["duck", "d u ck", "🦆"], ["sock", "s o ck", "🧦"], ["lock", "l o ck", "🔒"],
      ["rock", "r o ck", "🪨"] ] },
  { title: "Blends", tip: "Blend two sounds together fast: f-r = fr",
    words: [
      ["frog", "f r o g", "🐸"], ["crab", "c r a b", "🦀"], ["drum", "d r u m", "🥁"],
      ["flag", "f l a g", "🚩"], ["stop", "s t o p", "🛑"], ["sled", "s l e d", "🛷"],
      ["clap", "c l a p", "👏"], ["swim", "s w i m", "🏊"], ["nest", "n e s t", "🪺"],
      ["tent", "t e n t", "⛺"] ] },
  { title: "Magic e", tip: "Magic e is quiet, but makes the vowel say its NAME!",
    words: [
      ["cake", "c a:A k e:_", "🎂"], ["kite", "k i:I t e:_", "🪁"], ["bike", "b i:I k e:_", "🚲"],
      ["rose", "r o:O s:z e:_", "🌹"], ["cube", "c u:U b e:_", "🧊"], ["bone", "b o:O n e:_", "🦴"],
      ["game", "g a:A m e:_", "🎮"], ["nose", "n o:O s:z e:_", "👃"], ["five", "f i:I v e:_", "5️⃣"],
      ["lake", "l a:A k e:_", "🏞️"] ] },
  { title: "Vowel teams", tip: "When two vowels go walking, the first one does the talking!",
    words: [
      ["tree", "t r ee", "🌳"], ["bee", "b ee", "🐝"], ["sheep", "sh ee p", "🐑"],
      ["feet", "f ee t", "🦶"], ["moon", "m oo n", "🌙"], ["boot", "b oo t", "👢"],
      ["rain", "r ai n", "🌧️"], ["boat", "b oa t", "⛵"], ["goat", "g oa t", "🐐"],
      ["train", "t r ai n", "🚆"] ] },
  { title: "Bossy r", tip: "r is bossy! It changes the vowel sound: ar, or, ir",
    words: [
      ["car", "c ar", "🚗"], ["star", "s t ar", "⭐"], ["shark", "sh ar k", "🦈"],
      ["bird", "b ir d", "🐦"], ["corn", "c or n", "🌽"], ["fork", "f or k", "🍴"],
      ["girl", "g ir l", "👧"], ["farm", "f ar m", "🚜"], ["horn", "h or n", "📯"],
      ["jar", "j ar", "🫙"] ] }
];

// Words a speech recogniser may hear instead of the target (accepted as correct)
const SOUNDALIKES = {
  ant: ["aunt", "and"], red: ["read"], sun: ["son"], bee: ["be", "b"], ten: ["10"],
  six: ["6"], five: ["5"], hen: ["hun"], bus: ["buss"], nut: ["not"], pup: ["pop"],
  rose: ["rows", "roes"], nose: ["knows", "no's"], boot: ["boots"], cube: ["cue"],
  pan: ["pam"], jar: ["jaw"], horn: ["horne"], fork: ["folk"], tub: ["tab"],
  kid: ["kit"], bed: ["bad"], net: ["nat"], jet: ["jets"], egg: ["ag"], dot: ["dart"],
  hot: ["hut"], car: ["ca"], lock: ["luck"], rock: ["rack"], chick: ["check"],
  bird: ["bud"], tree: ["three"], lake: ["lick"], game: ["gem"]
};

/* ---------------- SPEAKING ---------------- */

// Colourful Semantics colours: WHO (orange) / DOING (yellow) / WHAT (green) / WHERE (blue)
const ROLES = {
  who:   { label: "Who?",   ask: "Who is in the picture?",  color: "#ff8a3d" },
  doing: { label: "Doing?", ask: "What are they doing?",     color: "#ffd23f" },
  what:  { label: "What?",  ask: "What do they have?",       color: "#3ec46d" },
  where: { label: "Where?", ask: "Where are they?",          color: "#3fa7ff" }
};

// each element: [phrase, emoji, keyword stems the child must say]
const SCENES = [
  { who: ["the dog", "🐶", ["dog", "puppy", "doggy"]], doing: ["is eating", "😋", ["eat", "chew", "munch"]],
    what: ["a bone", "🦴", ["bone"]], where: ["in the park", "🌳", ["park", "grass", "tree", "outside"]] },
  { who: ["the girl", "👧", ["girl", "she"]], doing: ["is kicking", "🦵", ["kick", "play"]],
    what: ["a ball", "⚽", ["ball", "soccer", "football"]], where: ["in the garden", "🌷", ["garden", "yard", "outside", "grass"]] },
  { who: ["the cat", "🐱", ["cat", "kitty", "kitten"]], doing: ["is drinking", "👅", ["drink", "lick", "lap"]],
    what: ["milk", "🥛", ["milk"]], where: ["in the kitchen", "🍽️", ["kitchen", "house", "home"]] },
  { who: ["the boy", "👦", ["boy", "he"]], doing: ["is reading", "👀", ["read", "look"]],
    what: ["a book", "📖", ["book", "story"]], where: ["in bed", "🛏️", ["bed", "bedroom"]] },
  { who: ["the monkey", "🐵", ["monkey", "monk"]], doing: ["is eating", "😋", ["eat", "munch"]],
    what: ["a banana", "🍌", ["banana"]], where: ["in the tree", "🌴", ["tree", "jungle", "forest"]] },
  { who: ["the baby", "👶", ["baby"]], doing: ["is hugging", "🤗", ["hug", "hold", "cuddl"]],
    what: ["a teddy", "🧸", ["teddy", "bear", "toy"]], where: ["on the sofa", "🛋️", ["sofa", "couch", "chair"]] },
  { who: ["mom", "👩", ["mom", "mum", "mommy", "mummy", "mother", "lady", "woman"]], doing: ["is baking", "👩‍🍳", ["bak", "mak", "cook"]],
    what: ["a cake", "🎂", ["cake"]], where: ["in the kitchen", "🍽️", ["kitchen", "house", "home"]] },
  { who: ["the bear", "🐻", ["bear"]], doing: ["is catching", "🎣", ["catch", "fish", "get"]],
    what: ["a fish", "🐟", ["fish"]], where: ["in the river", "🏞️", ["river", "water", "lake"]] },
  { who: ["dad", "👨", ["dad", "daddy", "father", "man"]], doing: ["is driving", "🚦", ["driv", "go", "rid"]],
    what: ["a car", "🚗", ["car"]], where: ["on the road", "🛣️", ["road", "street"]] },
  { who: ["the bunny", "🐰", ["bunny", "rabbit"]], doing: ["is eating", "😋", ["eat", "munch", "chew"]],
    what: ["a carrot", "🥕", ["carrot"]], where: ["in the garden", "🌻", ["garden", "yard", "grass"]] },
  { who: ["the girl", "👧", ["girl", "she"]], doing: ["is flying", "💨", ["fly", "flies", "play"]],
    what: ["a kite", "🪁", ["kite"]], where: ["at the beach", "🏖️", ["beach", "sand", "sea"]] },
  { who: ["the boy", "👦", ["boy", "he"]], doing: ["is brushing", "🪥", ["brush", "clean"]],
    what: ["his teeth", "🦷", ["teeth", "tooth"]], where: ["in the bathroom", "🛁", ["bathroom", "bath", "sink"]] },
  { who: ["the penguin", "🐧", ["penguin"]], doing: ["is sliding on", "🛝", ["slid", "skat", "slip"]],
    what: ["the ice", "🧊", ["ice"]], where: ["in the snow", "❄️", ["snow", "cold", "winter"]] },
  { who: ["the kid", "🧒", ["kid", "child", "boy", "girl"]], doing: ["is painting", "🖌️", ["paint", "draw", "color", "colour"]],
    what: ["a picture", "🎨", ["picture", "painting", "art", "rainbow"]], where: ["at school", "🏫", ["school", "class"]] },
  { who: ["the bird", "🐦", ["bird"]], doing: ["is singing", "🎶", ["sing", "tweet", "chirp"]],
    what: ["a song", "🎵", ["song", "music"]], where: ["in the tree", "🌳", ["tree", "branch", "nest"]] },
  { who: ["the frog", "🐸", ["frog", "froggy"]], doing: ["is sitting on", "🪷", ["sit", "jump", "stand"]],
    what: ["a leaf", "🍃", ["leaf", "leaves", "lily"]], where: ["in the pond", "💧", ["pond", "water", "lake"]] },
  { who: ["grandma", "👵", ["grandma", "granny", "nana", "grandmother", "lady"]], doing: ["is knitting", "🧶", ["knit", "mak", "sew"]],
    what: ["a scarf", "🧣", ["scarf"]], where: ["by the fire", "🔥", ["fire", "home", "house"]] },
  { who: ["the fish", "🐠", ["fish"]], doing: ["is blowing", "🫧", ["blow", "mak"]],
    what: ["bubbles", "🫧", ["bubble"]], where: ["in the sea", "🌊", ["sea", "ocean", "water"]] }
];

// Which sentence parts the child builds at each speaking level (gradual expansion)
const SPEAK_LEVELS = [
  { title: "Who + Doing",         roles: ["who", "doing"],                 frames: [0, 1] },
  { title: "Who + Doing",         roles: ["who", "doing"],                 frames: [2, 3] },
  { title: "Who + Doing + What",  roles: ["who", "doing", "what"],         frames: [0, 4] },
  { title: "Who + Doing + What",  roles: ["who", "doing", "what"],         frames: [5, 2] },
  { title: "Who + Doing + What",  roles: ["who", "doing", "what"],         frames: [6, 3] },
  { title: "Big Sentences",       roles: ["who", "doing", "what", "where"], frames: [7, 4] },
  { title: "Big Sentences",       roles: ["who", "doing", "what", "where"], frames: [8, 5] },
  { title: "Big Sentences",       roles: ["who", "doing", "what", "where"], frames: [9, 6] },
  { title: "Super Sentences",     roles: ["who", "doing", "what", "where"], frames: [10, 8] },
  { title: "Story Teller",        roles: ["who", "doing", "what", "where"], frames: [9, 10] }
];

// Carrier-phrase sentence frames. {x} is filled by the picture.
const FRAMES = [
  { frame: "I see a {x}.",            items: [["cat", "🐱"], ["ball", "⚽"], ["bus", "🚌"], ["star", "⭐"]] },
  { frame: "I like {x}.",             items: [["apples", "🍎"], ["dogs", "🐶"], ["ice cream", "🍦"], ["trains", "🚆"]] },
  { frame: "I can {x}.",              items: [["jump", "🦘"], ["run", "🏃"], ["swim", "🏊"], ["dance", "💃"]] },
  { frame: "I want {x}, please.",     items: [["juice", "🧃"], ["a cookie", "🍪"], ["a hug", "🤗"], ["my teddy", "🧸"]] },
  { frame: "The {x} is big.",         items: [["elephant", "🐘"], ["truck", "🚚"], ["whale", "🐋"], ["house", "🏠"]] },
  { frame: "I have a {x}.",           items: [["hat", "🧢"], ["book", "📖"], ["balloon", "🎈"], ["bike", "🚲"]] },
  { frame: "The {x} is red.",         items: [["apple", "🍎"], ["car", "🚗"], ["heart", "❤️"], ["strawberry", "🍓"]] },
  { frame: "I am happy when I {x}.",  items: [["play", "🧸"], ["sing", "🎤"], ["swing", "🛝"], ["paint", "🎨"]] },
  { frame: "I feel {x} because I am tired.", items: [["sleepy", "😴"], ["grumpy", "😠"], ["slow", "🐢"], ["sad", "😢"]] },
  { frame: "First I {x}, then I eat breakfast.", items: [["wake up", "⏰"], ["wash my face", "🧼"], ["get dressed", "👕"], ["brush my teeth", "🪥"]] },
  { frame: "The {x} is soft and fluffy.", items: [["bunny", "🐰"], ["cloud", "☁️"], ["pillow", "🛏️"], ["kitten", "🐱"]] }
];

// Conversation with Ollie the Owl. frame = the "big sentence" modelled back (expansion/recast).
const CONVO = [
  { q: "What is your favorite animal?", frame: "My favorite animal is the {x}.", react: "I love the {x} too! Hoo hoo!",
    options: [["dog", "🐶"], ["cat", "🐱"], ["lion", "🦁"], ["elephant", "🐘"]] },
  { q: "What do you like to eat?", frame: "I like to eat {x}.", react: "Yum yum, {x}! That sounds tasty.",
    options: [["pizza", "🍕"], ["apples", "🍎"], ["pasta", "🍝"], ["ice cream", "🍦"]] },
  { q: "What color do you like best?", frame: "I like the color {x}.", react: "{x} is a beautiful color!",
    options: [["red", "🟥"], ["blue", "🟦"], ["green", "🟩"], ["purple", "🟪"]] },
  { q: "What toy do you like to play with?", frame: "I like to play with my {x}.", react: "Wow, playing with a {x} is so fun!",
    options: [["blocks", "🧱"], ["teddy", "🧸"], ["ball", "⚽"], ["cars", "🚗"]] },
  { q: "Where do you like to go?", frame: "I like to go to the {x}.", react: "The {x}! What a fun place.",
    options: [["park", "🛝"], ["beach", "🏖️"], ["zoo", "🦓"], ["shop", "🏪"]] },
  { q: "What do you like to do outside?", frame: "Outside, I like to {x}.", react: "You like to {x}? Super!",
    options: [["run", "🏃"], ["swing", "🛝"], ["ride my bike", "🚲"], ["dig", "⛏️"]] },
  { q: "How do you feel today?", frame: "Today I feel {x}.", react: "Thank you for telling me you feel {x}.",
    options: [["happy", "😀"], ["sleepy", "😴"], ["silly", "🤪"], ["excited", "🤩"]] },
  { q: "What is the weather like today?", frame: "Today it is {x}.", react: "Oh, {x}! Thanks for telling me.",
    options: [["sunny", "☀️"], ["rainy", "🌧️"], ["cloudy", "☁️"], ["windy", "💨"]] },
  { q: "Who do you like to play with?", frame: "I like to play with my {x}.", react: "Playing with your {x} sounds lovely!",
    options: [["friend", "🧒"], ["brother", "👦"], ["sister", "👧"], ["mom", "👩"]] },
  { q: "What animal can fly?", frame: "A {x} can fly.", react: "Yes! A {x} can fly up high!",
    options: [["bird", "🐦"], ["butterfly", "🦋"], ["bee", "🐝"], ["owl", "🦉"]] }
];

// Story sequencing: First / Next / Last
const STORIES = [
  { pics: ["🥚", "🐣", "🐥"], lines: ["First, there is an egg.", "Next, the egg cracks.", "Last, a baby chick comes out."], keys: ["egg", "crack", "chick"] },
  { pics: ["🌱", "🌿", "🌻"], lines: ["First, a little seed grows.", "Next, the plant gets bigger.", "Last, a flower opens."], keys: ["seed", "grow", "flower"] },
  { pics: ["🛁", "👕", "🛏️"], lines: ["First, I take a bath.", "Next, I put on my pajamas.", "Last, I go to bed."], keys: ["bath", "pajama", "bed"] },
  { pics: ["☁️", "🌧️", "🌈"], lines: ["First, the clouds come.", "Next, it starts to rain.", "Last, a rainbow comes out."], keys: ["cloud", "rain", "rainbow"] },
  { pics: ["🍞", "🧈", "🥪"], lines: ["First, I get some bread.", "Next, I add the butter.", "Last, I eat my sandwich."], keys: ["bread", "butter", "sandwich"] },
  { pics: ["🎂", "🕯️", "🎉"], lines: ["First, we get a cake.", "Next, I blow out the candles.", "Last, we have a party."], keys: ["cake", "candle", "party"] },
  { pics: ["⛄", "☀️", "💧"], lines: ["First, we build a snowman.", "Next, the sun comes out.", "Last, the snowman melts."], keys: ["snowman", "sun", "melt"] },
  { pics: ["🐛", "🍃", "🦋"], lines: ["First, there is a caterpillar.", "Next, it eats lots of leaves.", "Last, it becomes a butterfly."], keys: ["caterpillar", "leaves", "butterfly"] }
];

const PRAISE = ["Amazing!", "Super job!", "You did it!", "Wow, great reading!", "Hero power!",
  "Fantastic!", "Brilliant!", "Way to go!", "You're a star!", "Awesome!"];
const ENCOURAGE = ["Good try! Let's listen again.", "Almost! Try one more time.", "Nice try, hero!",
  "Let's do it together!", "You're getting stronger!"];
const STICKERS = ["🦖", "🚀", "🦄", "🐉", "🏎️", "🧁", "🦁", "🌈", "🐙", "🏆",
  "🦕", "🛸", "🐬", "🎸", "🦜", "🍩", "🐯", "⚡", "🪐", "👑"];

/* ---------------- Captain Leap's lesson presentations ---------------- */
// focus: [soundKey, how it's written, example word, emoji]   kind: picks the explanation
const READING_INTROS = [
  { kind: "short", focus: [["a", "a", "ant", "🐜"]] },
  { kind: "short", focus: [["e", "e", "egg", "🥚"]] },
  { kind: "short", focus: [["i", "i", "pig", "🐷"]] },
  { kind: "short", focus: [["o", "o", "dog", "🐶"]] },
  { kind: "short", focus: [["u", "u", "sun", "☀️"]] },
  { kind: "digraph", focus: [["sh", "sh", "ship", "🚢"], ["ch", "ch", "chick", "🐥"], ["th", "th", "bath", "🛁"], ["ck", "ck", "duck", "🦆"]] },
  { kind: "blend", focus: [["f", "f", "frog", "🐸"], ["r", "r", "frog", "🐸"]], demo: ["f r o g", "frog"] },
  { kind: "magic", focus: [["A", "a_e", "cake", "🎂"], ["I", "i_e", "kite", "🪁"]], demo: [["cap", "cape"], ["kit", "kite"]] },
  { kind: "team", focus: [["ee", "ee", "tree", "🌳"], ["oo", "oo", "moon", "🌙"], ["ai", "ai", "rain", "🌧️"], ["oa", "oa", "boat", "⛵"]] },
  { kind: "r", focus: [["ar", "ar", "car", "🚗"], ["or", "or", "corn", "🌽"], ["ir", "ir", "bird", "🐦"]] }
];
const KIND_TALK = {
  short: "This is a short vowel. Short vowels are quick and bouncy, just like me! Boing!",
  digraph: "Ooh, super special letters today! When two letters hold hands, they make ONE brand new sound!",
  blend: "Today we BLEND! Blending is like a race car. Say each sound, then zoom them together, faster and faster!",
  magic: "Shhh... meet Magic e! Magic e is a quiet ninja. It never makes a sound, but it zaps the vowel, and the vowel says its NAME!",
  team: "Vowel teams! When two vowels go walking, the first one does the talking!",
  r: "Uh oh, here comes Bossy r! Bossy r is SO bossy, it changes the vowel's sound!"
};
// what Captain Leap says about each part of the sentence train (Colourful Semantics)
const ROLE_TALK = {
  who: "The orange car is WHO. It tells us who is in the picture, like a dog, or a girl!",
  doing: "The yellow car is DOING. What are they doing? Running, eating, jumping!",
  what: "The green car is WHAT. What do they have? A ball, a cake, a book!",
  where: "The blue car is WHERE. Where are they? In the park, or at school!"
};
const HELLOS = ["Hey hey, {name}! Captain Leap is here!", "Woo hoo! Hi {name}! It's me, Captain Leap!",
  "Ta-da! Captain Leap to the rescue! Hi {name}!", "Hello, super hero {name}! Ready for an adventure?"];
const WORD_LINES = ["Whoa, a new word! Let's sneak up on it... slide your finger under the letters!",
  "Hero eyes ON, {name}! Let's read this one together!", "Ooh, look at this picture! Let's find out the word!",
  "Here comes another word! Zoom zoom!", "Ready, set, READ! Touch each letter and listen!",
  "I spy a new word! Can you help me read it?", "You're doing amazing, {name}! Next word!"];
const SAY_LINES = ["Your turn, hero! Press the big red button and read it to me!",
  "Now YOU read it! Tap the microphone. I'm listening with my super ears!",
  "Show me your reading power! Tap the mic and say the word!"];
const BUILD_LINES = ["Uh oh! The letters got all mixed up! Can you fix them? Tap them in order!",
  "Oh no, a letter tornado! Let's build the word {word} again!", "Builder time! Tap the letters to make {word}!"];
const WIN_LINES = ["BOOM! You did it, {name}!", "Kapow! Super reading!", "Yes yes YES! High five!",
  "Wow! Your brain is so strong!", "Zoom! That was awesome!", "You're a reading super star!"];
