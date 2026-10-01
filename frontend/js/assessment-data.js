/*
 * ALL ASSESSMENT CONTENT LIVES IN THIS FILE  (protocol v2, final).
 *
 *   assessmentData[ageGroup][session][module]
 *
 *   ageGroup : "5-7" | "8-10" | "11-13" | "14-15"
 *   session  : "S01" | "S02"
 *   module   : handwriting | reading | phonological | grapheme_phoneme | ran | memory
 *
 * To change a passage, question, RAN grid or memory sequence, edit the objects
 * below. No UI code needs to change. Remove a module key from a session to stop
 * administering it.
 *
 * The website only COLLECTS raw data:
 *   - Reading, RAN, Memory: audio recording + recording times.
 *   - Phonological awareness, Grapheme–phoneme knowledge: child's response + the
 *     assessor's mark (CORRECT / INCORRECT / NOT ATTEMPTED). No audio.
 *   - Handwriting: timer + status. No audio, no image upload.
 * It calculates nothing and diagnoses nothing.
 *
 * Questions, expected answers and passages are copied EXACTLY from the research
 * protocol (including nonwords such as "lant" and "pring"). Do not "correct" them.
 * `expected` is the protocol's expected answer, or null when the protocol gives none.
 *
 * Rules for ids: they are used in file names, so use only letters,
 * numbers, "_" and "-". Ids must be unique inside one module of one session.
 */

const PROTOCOL_VERSION = "2.1";

/* Exact wording to be read aloud. */
const SCRIPTS = {
  handwritingIntro: "I am going to give you a few writing activities. Please do them as naturally as you can.",
  copying: "Please copy this exactly as it is written. Take your time and try to write normally.",
  dictation: "I will read a sentence. Please write what I say.",
  reading: "Please read this passage aloud. Try to read it naturally.",
  ran: "Look at the items and name them from left to right as quickly and accurately as you can.",
  // Official child-facing memory instructions (confirmed by the researcher, 2026-10-01).
  memory: {
    FORWARD: "I will say some numbers. Say them back to me in the same order.",
    BACKWARD: "I will say some numbers. Say them back to me in reverse order.",
  },
};

/* ------------------------------------------------------------------ question helpers
 * These only build plain objects. `say` is the protocol wording shown to the assessor.
 *   mc   – multiple choice; the options are shown
 *   item – any other question (spoken answer)
 */
function mc(id, say, options, expected) {
  const keys = ["A", "B", "C", "D", "E", "F"];
  return { id, type: "mc", say, options: options.map((text, i) => ({ key: keys[i], text })), expected };
}
function item(id, say, expected = null, extra = {}) {
  return { id, type: "open", say, expected, ...extra };
}

/* ------------------------------------------------------------------ RAN grids
 * Fixed grids (never randomised at page load). Read left → right, top → bottom.
 * Each grid has a grid_id that is saved in session.json together with the full
 * item list, so researchers know exactly what was presented.
 * IMPLEMENTATION-CREATED stimulus grids: the protocol supplies the stimulus categories
 * (5–7 apple/cat/dog/ball/sun; 8–10 single digits; 11–13 numbers + letters; 14–15
 * numbers 2,5,7,9 + letters A,E,K,M + colours Red/Blue/Green/Yellow) but not the exact
 * digits/letters, grid size or arrangement. These grids were created by the developer
 * from those categories (grid version 1, 2026-10-01; confirmed for use by the researcher):
 *   - every stimulus appears equally often, no stimulus appears twice in a row;
 *   - 11–13 alternates number / letter; 14–15 cycles number / letter / colour.
 * Items are shown as: emoji (RAN_EMOJI), coloured circle (RAN_COLOURS), or the text itself.
 */
const RAN_GRID_SOURCE = "IMPLEMENTATION_CREATED from the protocol's stimulus categories (not researcher-supplied grid content)";
const RAN_EMOJI = { apple: "🍎", cat: "🐱", dog: "🐶", ball: "⚽", sun: "☀️", fish: "🐟", car: "🚗", tree: "🌳" };
const RAN_COLOURS = { Red: "#d62828", Blue: "#1d4ed8", Green: "#15803d", Yellow: "#facc15" };

/* 5–7: a separate grid per session (Session 1 = 5 × 3, Session 2 = 5 × 5).
 * Every row contains all five pictures once; no picture repeats in a column or next to itself. */
const RAN_5_7_S01 = {
  tasks: [{
    id: "OBJ",
    grid_id: "RAN_5-7_S01_OBJECTS_5x3_V2",
    title: "Objects",
    category: "Objects (apple, cat, dog, ball, sun)",
    instruction: SCRIPTS.ran,
    columns: 5,
    items: [
      "ball", "apple", "dog", "cat", "sun",
      "dog", "cat", "sun", "apple", "ball",
      "apple", "sun", "ball", "dog", "cat",
    ],
  }],
};
const RAN_5_7_S02 = {
  tasks: [{
    id: "OBJ",
    grid_id: "RAN_5-7_S02_OBJECTS_5x5_V2",
    title: "Objects",
    category: "Objects (apple, cat, dog, ball, sun)",
    instruction: SCRIPTS.ran,
    columns: 5,
    items: [
      "ball", "apple", "sun", "dog", "cat",
      "sun", "cat", "ball", "apple", "dog",
      "cat", "sun", "dog", "ball", "apple",
      "dog", "ball", "apple", "cat", "sun",
      "apple", "dog", "cat", "sun", "ball",
    ],
  }],
};
/* 8–10: Session 1 = 5 × 3 single-digit numbers, Session 2 = 5 × 5 letters (researcher request).
 * Every row contains all five stimuli once; no stimulus repeats in a column or next to itself. */
const RAN_8_10_S01 = {
  tasks: [{
    id: "NUM",
    grid_id: "RAN_8-10_S01_NUMBERS_5x3_V2",
    title: "Numbers",
    category: "Single-digit numbers (2, 4, 6, 7, 9)",
    instruction: SCRIPTS.ran,
    columns: 5,
    items: [
      "9", "4", "2", "6", "7",
      "6", "9", "4", "7", "2",
      "7", "2", "9", "4", "6",
    ],
  }],
};
const RAN_8_10_S02 = {
  tasks: [{
    id: "LET",
    grid_id: "RAN_8-10_S02_LETTERS_5x5_V2",
    title: "Letters",
    category: "Letters (A, B, C, D, E)",
    instruction: SCRIPTS.ran,
    columns: 5,
    items: [
      "E", "C", "D", "B", "A",
      "B", "A", "C", "D", "E",
      "C", "D", "E", "A", "B",
      "D", "B", "A", "E", "C",
      "A", "E", "B", "C", "D",
    ],
  }],
};
/* 11–13: 5 × 5 mixed grids of pictures + a number + a letter (researcher request).
 * Session 2 uses a completely different set. Every row contains all five stimuli once;
 * no stimulus repeats in a column or next to itself. */
const RAN_11_13_S01 = {
  tasks: [{
    id: "MIX",
    grid_id: "RAN_11-13_S01_MIXED_5x5_V2",
    title: "Pictures, numbers and letters",
    category: "Mixed: pictures (apple, cat, sun) + number (4) + letter (B)",
    instruction: SCRIPTS.ran,
    columns: 5,
    items: [
      "B", "cat", "4", "sun", "apple",
      "cat", "B", "apple", "4", "sun",
      "4", "sun", "B", "apple", "cat",
      "apple", "4", "sun", "cat", "B",
      "sun", "apple", "cat", "B", "4",
    ],
  }],
};
const RAN_11_13_S02 = {
  tasks: [{
    id: "MIX",
    grid_id: "RAN_11-13_S02_MIXED_5x5_V2",
    title: "Pictures, numbers and letters",
    category: "Mixed: pictures (fish, car, tree) + number (5) + letter (M)",
    instruction: SCRIPTS.ran,
    columns: 5,
    items: [
      "car", "5", "M", "fish", "tree",
      "M", "tree", "fish", "5", "car",
      "5", "fish", "car", "tree", "M",
      "fish", "M", "tree", "car", "5",
      "tree", "car", "5", "M", "fish",
    ],
  }],
};
/* 14–15: 5 × 5 mixed grids (researcher request).
 * Session 1 = numbers + letter + colours (from the protocol's example set: 2, 5, 7, 9 / A, E, K, M / Red, Blue, Green, Yellow).
 * Session 2 = numbers + letter + words (different set).
 * Every row contains all five stimuli once; no stimulus repeats in a column or next to itself. */
const RAN_14_15_S01 = {
  tasks: [{
    id: "MIXED",
    grid_id: "RAN_14-15_S01_MIXED_5x5_V2",
    title: "Numbers, letters and colours",
    category: "Mixed: numbers (2, 7) + letter (A) + colours (Red, Blue)",
    instruction: SCRIPTS.ran,
    columns: 5,
    items: [
      "Red", "A", "Blue", "7", "2",
      "A", "2", "Red", "Blue", "7",
      "Blue", "Red", "7", "2", "A",
      "2", "7", "A", "Red", "Blue",
      "7", "Blue", "2", "A", "Red",
    ],
  }],
};
const RAN_14_15_S02 = {
  tasks: [{
    id: "MIXED",
    grid_id: "RAN_14-15_S02_MIXED_5x5_V2",
    title: "Numbers, letters and words",
    category: "Mixed: numbers (5, 9) + letter (M) + words (cup, hat)",
    instruction: SCRIPTS.ran,
    columns: 5,
    items: [
      "9", "5", "M", "cup", "hat",
      "5", "9", "cup", "hat", "M",
      "hat", "M", "9", "5", "cup",
      "M", "cup", "hat", "9", "5",
      "cup", "hat", "5", "M", "9",
    ],
  }],
};

/* ------------------------------------------------------------------ memory sequences */
const MEM_5_7_LEVELS = [
  { id: "L1", label: "Level 1", sequences: [[4, 7], [2, 8], [5, 1]] },
  { id: "L2", label: "Level 2", sequences: [[3, 6, 2], [7, 4, 9], [5, 2, 8]] },
  { id: "L3", label: "Level 3", sequences: [[4, 1, 7, 3], [8, 2, 5, 9]] },
];
const MEM_8_10_LEVELS = [
  { id: "L3D", label: "3 digits", sequences: [[4, 8, 2], [7, 1, 5], [3, 9, 6]] },
  { id: "L4D", label: "4 digits", sequences: [[5, 2, 8, 4], [7, 3, 1, 9], [6, 4, 9, 2]] },
  { id: "L5D", label: "5 digits", sequences: [[3, 8, 1, 6, 4], [9, 2, 5, 7, 3]] },
  { id: "L6D", label: "6 digits", sequences: [[4, 7, 2, 9, 1, 5], [8, 3, 6, 1, 4, 7]] },
];
const MEM_11_15_LEVELS = [
  { id: "L3D", label: "3 digits", sequences: [[7, 2, 9], [4, 8, 3]] },
  { id: "L4D", label: "4 digits", sequences: [[6, 1, 9, 4], [3, 7, 2, 8]] },
  { id: "L5D", label: "5 digits", sequences: [[8, 4, 1, 6, 3], [2, 9, 5, 7, 4]] },
  { id: "L6D", label: "6 digits", sequences: [[7, 3, 9, 1, 5, 2], [4, 8, 2, 6, 9, 3]] },
];

/* ================================================================== PROTOCOL */
const assessmentData = {
  /* ============================================================ AGE 5–7 */
  "5-7": {
    S01: {
      handwriting: {
        copying: { text_id: "HW_5-7_S01_COPY", text: "The little bird sat on a tree." },
        dictation: { text_id: "HW_5-7_S01_DICT", text: "The boy has a red ball." },
      },
      reading: { passage_id: "R_5-7_S01", title: "The Little Cat",
        text: "Mia has a little cat. The cat is white and soft. It likes to play with a red ball." },
      phonological: {
        sections: [
          { id: "RHYME", title: "Rhyme Recognition", items: [
            mc("Q1", "Which word rhymes with cat?", ["Sun", "Hat", "Dog", "Pen"], "Hat"),
            mc("Q2", "Which word rhymes with cake?", ["Ball", "Make", "Fish", "Run"], "Make"),
          ] },
          { id: "BEGIN", title: "Beginning Sound", items: [
            mc("Q3", "Which word starts with the same sound as ball?", ["Boy", "Cat", "Sun", "Fish"], "Boy"),
            item("Q4", "What is the first sound in sun?", "/s/"),
          ] },
          { id: "BLEND", title: "Sound Blending", items: [
            item("Q5", "Say: /c/ + /a/ + /t/", "cat"),
            item("Q6", "Say: /d/ + /o/ + /g/", "dog"),
          ] },
          { id: "PHONID", title: "Phoneme Identification", items: [
            item("Q7", "What is the last sound in map?", "/p/"),
            item("Q8", "What sound do fish and fan have at the beginning?", "/f/"),
          ] },
        ],
      },
      ran: RAN_5_7_S01,
      memory: { condition: "FORWARD", levels: MEM_5_7_LEVELS },
    },
    S02: {
      handwriting: {
        copying: { text_id: "HW_5-7_S02_COPY", text: "The sun is bright today." },
        dictation: { text_id: "HW_5-7_S02_DICT", text: "The boy found a small red ball." },
      },
      reading: { passage_id: "R_5-7_S02", title: "At the Park",
        text: "Ravi went to the park with his mother. He played on the swing and ran on the grass." },
      grapheme_phoneme: {
        sections: [
          { id: "LETSND", title: "Letter → Sound",
            say: "Show the letter to the child. The child provides the sound.",
            items: [
              item("Q1", "M", "/m/", { child_display: "M" }),
              item("Q2", "S", "/s/", { child_display: "S" }),
              item("Q3", "T", "/t/", { child_display: "T" }),
              item("Q4", "P", "/p/", { child_display: "P" }),
              item("Q5", "B", "/b/", { child_display: "B" }),
            ] },
        ],
      },
      phonological: {
        sections: [
          { id: "RHYME", title: "Rhyming", say: "Ask: Does cat rhyme with hat?", items: [
            item("1", "cat – hat", "YES"),
            item("2", "sun – run", "YES"),
            item("3", "cake – make", "YES"),
            item("4", "dog – fish", "NO"),
            item("5", "ball – tree", "NO"),
          ] },
          { id: "INIT", title: "Initial Sound", say: "Ask: What is the first sound in...?", items: [
            item("1", "sun", "/s/"),
            item("2", "ball", "/b/"),
            item("3", "fish", "/f/"),
            item("4", "moon", "/m/"),
            item("5", "dog", "/d/"),
          ] },
          { id: "FINAL", title: "Final Sound", say: "Ask: What is the last sound in...?", items: [
            item("1", "cat", "/t/"),
            item("2", "sun", "/n/"),
            item("3", "dog", "/g/"),
            item("4", "map", "/p/"),
            item("5", "fish", "/ʃ/"),
          ] },
        ],
      },
      ran: RAN_5_7_S02,
      memory: { condition: "BACKWARD", levels: MEM_5_7_LEVELS },
    },
  },

  /* ============================================================ AGE 8–10 */
  "8-10": {
    S01: {
      handwriting: {
        copying: { text_id: "HW_8-10_S01_COPY",
          text: "On Saturday morning, Rahul went to the park with his sister. They saw many birds near the pond and played under a large tree." },
        dictation: { text_id: "HW_8-10_S01_DICT", text: "The boy helped his teacher clean the classroom along with his friends." },
      },
      reading: { passage_id: "R_8-10_S01", title: "The School Garden",
        text: "Our school has a small garden. The students water the plants every morning. There are roses, sunflowers, and tomato plants. Everyone was excited." },
      phonological: {
        sections: [
          { id: "RHYME", title: "Rhyme", items: [
            mc("Q1", "Which word rhymes with light?", ["Late", "Night", "Lot", "Let"], "Night."),
            mc("Q2", "Which pair rhymes?", ["Book – Back", "Train – Brain", "Cat – Cup", "Fish – Fan"], "Train – Brain."),
          ] },
          { id: "BLEND", title: "Phoneme Blending", items: [
            item("Q3", "/sh/ + /i/ + /p/", "SHIP"),
            item("Q4", "/b/ + /l/ + /a/ + /k/", "BLACK"),
          ] },
          { id: "DEL", title: "Phoneme Deletion", items: [
            item("Q5", "Say cat without /k/.", "at"),
            item("Q6", "Say plane without /p/.", "lane"),
          ] },
          { id: "SUB", title: "Sound Substitution", items: [
            item("Q7", "Change /m/ in mat to /s/.", "sat"),
            item("Q8", "Change /c/ in cat to /h/.", "hat"),
          ] },
        ],
      },
      ran: RAN_8_10_S01,
      memory: { condition: "FORWARD", levels: MEM_8_10_LEVELS },
    },
    S02: {
      handwriting: {
        copying: { text_id: "HW_8-10_S02_COPY",
          text: "After school, Arjun went to the playground with his friends. They played football for a while and then sat under a shady tree to drink some water." },
        dictation: { text_id: "HW_8-10_S02_DICT", text: "The students carefully organized their books before the class began." },
      },
      reading: { passage_id: "R_8-10_S02", title: "A Rainy Morning",
        text: "It started raining while Sara was getting ready for school. She packed her books in her bag. The roads were wet, but she reached school safely with her brother." },
      phonological: {
        sections: [
          { id: "RHYME", title: "Rhyming", items: [
            item("1", "light – night", "YES"),
            item("2", "tree – free", "YES"),
            item("3", "chair – bear", "YES"),
            item("4", "house – mouse", "YES"),
            item("5", "book – sun", "NO"),
          ] },
          { id: "INIT", title: "Initial Phoneme", items: [
            item("1", "plant", "/p/"),
            item("2", "school", "/s/"),
            item("3", "green", "/g/"),
            item("4", "train", "/t/"),
            item("5", "clock", "/k/"),
          ] },
          { id: "FINAL", title: "Final Phoneme", items: [
            item("1", "milk", "/k/"),
            item("2", "hand", "/d/"),
            item("3", "fish", "/ʃ/"),
            item("4", "lamp", "/p/"),
            item("5", "boat", "/t/"),
          ] },
          { id: "BLEND", title: "Blending", items: [
            item("1", "/s/ /t/ /o/ /p/", "stop"),
            item("2", "/f/ /l/ /a/ /g/", "flag"),
            item("3", "/c/ /r/ /a/ /b/", "crab"),
            item("4", "/s/ /p/ /i/ /n/", "spin"),
            item("5", "/b/ /r/ /i/ /ck/", "brick"),
          ] },
          { id: "DEL", title: "Deletion", items: [
            item("1", "cat without /k/", "at"),
            item("2", "plane without /p/", "lane"),
            item("3", "stop without /s/", "top"),
            item("4", "smile without /s/", "mile"),
            item("5", "train without /t/", "rain"),
          ] },
          { id: "SUB", title: "Substitution", items: [
            item("1", "map /m/→/t/", "tap"),
            item("2", "cat /c/→/h/", "hat"),
            item("3", "pan /p/→/m/", "man"),
            item("4", "bat /b/→/h/", "hat"),
            item("5", "sun /s/→/r/", "run"),
          ] },
        ],
      },
      ran: RAN_8_10_S02,
      memory: { condition: "BACKWARD", levels: MEM_8_10_LEVELS },
    },
  },

  /* ============================================================ AGE 11–13 */
  "11-13": {
    S01: {
      handwriting: {
        copying: { text_id: "HW_11-13_S01_COPY",
          text: "Technology has changed the way people communicate, learn, and work. Although digital devices are useful, strong reading and writing skills remain important because they help people express ideas clearly and understand information effectively." },
        dictation: { text_id: "HW_11-13_S01_DICT", text: "The children visited the museum during their school trip." },
      },
      reading: { passage_id: "R_11-13_S01", title: "Reading",
        text: "Reading helps us learn new things and understand different ideas. It can improve our vocabulary and help us express our thoughts clearly. Reading regularly also makes it easier to understand difficult texts and unfamiliar words." },
      phonological: {
        sections: [
          { id: "DEL", title: "Deletion", items: [
            item("Q1", "smile without /s/", "mile"),
            item("Q2", "plant without /p/", "lant"),
          ] },
          { id: "SUB", title: "Substitution", items: [
            item("Q3", "Change /k/ in coat to /g/.", "goat"),
            item("Q4", "Change /t/ in time to /d/.", "dime"),
          ] },
          { id: "ADD", title: "Addition", items: [
            item("Q5", "Add /s/ to the beginning of lip.", "slip"),
            item("Q6", "Add /t/ to the beginning of rip.", "trip"),
          ] },
          { id: "SYL", title: "Syllable Awareness", items: [
            item("Q7", "How many syllables are in computer?", "3"),
            item("Q8", "How many syllables are in elephant?", "3"),
          ] },
          { id: "ABLEND", title: "Advanced Blending", items: [
            item("Q9", "/c/ + /o/ + /m/ + /p/ + /l/ + /e/ + /t/", "complete"),
          ] },
        ],
      },
      ran: RAN_11_13_S01,
      memory: { condition: "FORWARD", levels: MEM_11_15_LEVELS },
    },
    S02: {
      handwriting: {
        copying: { text_id: "HW_11-13_S02_COPY",
          text: "Many students use computers and mobile devices for learning. While technology makes information easier to access, students should also develop good study habits and learn how to use digital resources responsibly." },
        dictation: { text_id: "HW_11-13_S02_DICT", text: "The students carefully completed their science project before the school exhibition." },
      },
      reading: { passage_id: "R_11-13_S02", title: "Exercise",
        text: "Regular exercise keeps our body healthy and gives us more energy. Activities such as walking, cycling, and playing sports can improve fitness. Exercise can also help students feel relaxed and concentrate better while studying." },
      phonological: {
        sections: [
          { id: "SEG", title: "Complex Segmentation", say: "Ask: Identify the individual sounds in:", items: [
            item("1", "plant"),
            item("2", "bright"),
            item("3", "school"),
            item("4", "spring"),
            item("5", "street"),
          ] },
          { id: "DEL", title: "Deletion", items: [
            item("1", "street without /s/"),
            item("2", "splash without /s/"),
            item("3", "plane without /p/"),
            item("4", "bright without /b/"),
            item("5", "train without /t/"),
          ] },
          { id: "SUB", title: "Substitution", items: [
            item("1", "bright first sound → /f/"),
            item("2", "clap first sound → /s/"),
            item("3", "train first sound → /b/"),
            item("4", "light first sound → /m/"),
            item("5", "cat final sound → /p/"),
          ] },
        ],
      },
      ran: RAN_11_13_S02,
      memory: { condition: "BACKWARD", levels: MEM_11_15_LEVELS },
    },
  },

  /* ============================================================ AGE 14–15 */
  "14-15": {
    S01: {
      handwriting: {
        copying: { text_id: "HW_14-15_S01_COPY",
          text: "People increasingly depend on digital technology for communication, education, and access to information. However, the ability to organize ideas and communicate clearly through writing remains an important academic and practical skill." },
        dictation: { text_id: "HW_14-15_S01_DICT",
          text: "Effective communication requires people to organize their thoughts clearly and express them accurately." },
      },
      reading: { passage_id: "R_14-15_S01", title: "Technology",
        text: "Technology has changed the way students learn. Online resources provide quick access to information, but students must learn to identify reliable sources. Using technology effectively requires both curiosity and the ability to manage distractions." },
      phonological: {
        sections: [
          { id: "CDEL", title: "Complex Phoneme Deletion", items: [
            item("Q1", "street without /s/", "treat"),
            item("Q2", "spring without /s/", "pring"),
          ] },
          { id: "SUB", title: "Substitution", items: [
            item("Q3", "Change /p/ in pride to /b/.", "bride"),
            item("Q4", "Change /k/ in clash to /f/.", "flash"),
          ] },
          { id: "ADD", title: "Addition", items: [
            item("Q5", "Add /s/ to beginning of park.", "spark"),
            item("Q6", "Add /t/ to beginning of rip.", "trip"),
          ] },
          { id: "SEG", title: "Segmentation", items: [
            item("Q7", "Break: strength", "/s/ /t/ /r/ /e/ /ŋ/ /θ/"),
          ] },
          { id: "CBLEND", title: "Complex Blending", items: [
            item("Q8", "/k/ /ə/ /n/ /s/ /t/ /r/ /ʌ/ /k/ /t/", "construct"),
          ] },
          { id: "MANIP", title: "Manipulation", items: [
            item("Q9", "Replace first sound of glow with /f/.", "flow"),
            item("Q10", "Remove first sound from bright.", "right"),
          ] },
        ],
      },
      ran: RAN_14_15_S01,
      memory: { condition: "FORWARD", levels: MEM_11_15_LEVELS },
    },
    S02: {
      handwriting: {
        copying: { text_id: "HW_14-15_S02_COPY",
          text: "The rapid development of technology has transformed many aspects of everyday life. While digital tools provide convenient ways to learn and communicate, students must also develop responsible habits when using technology and accessing information online." },
        dictation: { text_id: "HW_14-15_S02_DICT",
          text: "Clear writing allows people to express their ideas and explain their thoughts accurately." },
      },
      reading: { passage_id: "R_14-15_S02", title: "Learning From Mistakes",
        text: "Mistakes are a natural part of learning. When students understand why an answer is wrong, they can change their approach and try again. Careful practice and useful feedback can gradually improve their skills and confidence." },
      phonological: {
        sections: [
          { id: "MANIP", title: "Complex Manipulation", items: [
            item("Q1", "Remove first sound from spring."),
            item("Q2", "Remove first sound from street."),
            item("Q3", "Change first sound of glowing to /k/."),
            item("Q4", "Change first sound of bright to /f/."),
            item("Q5", "Change final sound of plant to /k/."),
          ] },
          { id: "ASEG", title: "Advanced Segmentation", items: [
            item("1", "strength"),
            item("2", "spring"),
            item("3", "splash"),
            item("4", "bright"),
            item("5", "transport"),
          ] },
        ],
      },
      ran: RAN_14_15_S02,
      memory: { condition: "BACKWARD", levels: MEM_11_15_LEVELS },
    },
  },
};

/* ------------------------------------------------------------------ module order + labels */

/* Each step of the assessment. `module` is the key in assessmentData; `part` is used
 * for handwriting, which is split into two steps so dictation can be assessor-only. */
const STEP_DEFS = [
  { type: "hw_copying", module: "handwriting", part: "copying", title: "Handwriting – Copying", assessorOnly: false },
  { type: "hw_dictation", module: "handwriting", part: "dictation", title: "Handwriting – Dictation", assessorOnly: true },
  { type: "reading", module: "reading", title: "Reading", assessorOnly: false },
  { type: "phonological", module: "phonological", title: "Phonological Awareness", assessorOnly: true },
  { type: "grapheme_phoneme", module: "grapheme_phoneme", title: "Grapheme–Phoneme Knowledge", assessorOnly: true },
  { type: "ran", module: "ran", title: "Rapid Automatized Naming (RAN)", assessorOnly: false },
  { type: "memory", module: "memory", title: "Memory (Digit Recall)", assessorOnly: true },
];

const AGE_GROUPS = ["5-7", "8-10", "11-13", "14-15"];
const SESSIONS = ["S01", "S02"];

function getAgeGroup(age) {
  age = Number(age);
  if (age >= 5 && age <= 7) return "5-7";
  if (age >= 8 && age <= 10) return "8-10";
  if (age >= 11 && age <= 13) return "11-13";
  if (age >= 14 && age <= 15) return "14-15";
  return null;
}

/* Returns the content object ({handwriting, reading, ...}) for a session + age. */
function getSessionContent(session, age) {
  const group = getAgeGroup(age);
  return (assessmentData[group] && assessmentData[group][session]) || {};
}

if (typeof module !== "undefined") {
  module.exports = { assessmentData, STEP_DEFS, AGE_GROUPS, SESSIONS, SCRIPTS, PROTOCOL_VERSION,
    RAN_GRID_SOURCE, RAN_EMOJI, RAN_COLOURS, getAgeGroup, getSessionContent };
}
