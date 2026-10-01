/*
 * ALL ASSESSMENT CONTENT LIVES IN THIS FILE.
 *
 * To change a passage, question, RAN stimulus or memory sequence, edit the
 * objects below. Nothing else needs to change.
 *
 * - `id` values are used in file names (e.g. PA1_Q01.webm, RAN_T01.webm),
 *   so keep them short and use only letters, numbers and "_".
 * - Remove a module from an age group to hide it for that age group.
 */

const HANDWRITING_INTRO =
  "I am going to give you a few writing activities. Please do them as naturally as you can.";

const H1_INSTRUCTION = "Please copy this exactly as it is written. Take your time and try to write normally.";
const H2_INSTRUCTION = "I will read a sentence. Please write what I say.";

const RAN_COLOURS = {
  Red: "#d62828",
  Blue: "#1d4ed8",
  Green: "#15803d",
  Yellow: "#facc15",
};

const assessmentData = {
  /* ===================================================== AGE 5–7 */
  "5-7": {
    handwriting: {
      intro: HANDWRITING_INTRO,
      tasks: [
        {
          id: "H1",
          title: "H1 – Copying",
          instruction: H1_INSTRUCTION,
          selectLabel: "Passage used",
          metaKey: "selected_passage",
          options: [
            { id: "1", label: "Passage 1", text: "The little bird sat on a tree. It sang a happy song." },
            { id: "1-short", label: "Passage 1 (shorter)", text: "The little bird sat on a tree." },
            { id: "2", label: "Passage 2", text: "The boy has a red ball." },
            { id: "2-short", label: "Passage 2 (shorter)", text: "The boy has a ball." },
            { id: "3", label: "Passage 3", text: "The sun is bright today." },
            { id: "3-short", label: "Passage 3 (shorter)", text: "The sun is bright." },
          ],
        },
        {
          id: "H2",
          title: "H2 – Dictation",
          instruction: H2_INSTRUCTION,
          note: "Read the sentence aloud. Do not record your voice. Spelling is not evaluated.",
          selectLabel: "Sentence used",
          metaKey: "selected_sentence",
          options: [
            { id: "1", label: "Sentence 1", text: "The cat is on the mat." },
            { id: "2", label: "Sentence 2 (older children in this age band)", text: "The boy has a red ball." },
          ],
        },
        {
          id: "H3",
          title: "H3 – Independent Writing",
          instruction: "Write about your favourite animal.",
          note: "If the child cannot produce sentences, follow the approved research protocol.",
          options: [],
        },
      ],
    },

    reading: {
      instruction: "Please read this passage aloud.",
      passages: [
        { id: "A", text: "Mia has a little cat. The cat is white and soft. It likes to play with a red ball." },
        { id: "B", text: "Ravi went to the park with his mother. He played on the swing and ran on the grass." },
      ],
    },

    phonological: {
      sections: [
        { id: "PA1", title: "Letter → Sound", instruction: "Show the letter. Ask: \"What sound does this letter make?\"",
          items: ["M", "S", "T", "P", "B"] },
        { id: "PA2", title: "Sound → Letter", instruction: "Say the sound. Ask: \"Which letter makes this sound?\"",
          items: ["/m/", "/s/", "/t/", "/p/", "/b/"] },
        { id: "PA3", title: "Rhyming", instruction: "Say both words. Ask: \"Do these words rhyme?\"",
          items: ["cat / hat", "sun / run", "cake / make", "dog / fish", "ball / tree"] },
        { id: "PA4", title: "Initial Sound", instruction: "Say the word. Ask: \"What is the first sound?\"",
          items: ["sun", "ball", "fish", "moon", "dog"] },
        { id: "PA5", title: "Final Sound", instruction: "Say the word. Ask: \"What is the last sound?\"",
          items: ["cat", "sun", "dog", "map", "fish"] },
        { id: "PA6", title: "Blending", instruction: "Say the sounds. Ask: \"What word do these sounds make?\"",
          items: ["/c/ - /a/ - /t/", "/m/ - /a/ - /p/", "/s/ - /u/ - /n/", "/d/ - /o/ - /g/", "/f/ - /i/ - /sh/"] },
      ],
    },

    ran: {
      tasks: [
        {
          id: "T01",
          title: "Objects",
          instruction: "Look at the symbols and say their names from left to right, as quickly as you can.",
          columns: 5,
          // Fixed order – replace with the official research stimuli when available.
          stimuli: [
            { display: "🍎", name: "apple" }, { display: "🐱", name: "cat" }, { display: "🐶", name: "dog" }, { display: "⚽", name: "ball" }, { display: "☀️", name: "sun" },
            { display: "🐶", name: "dog" }, { display: "☀️", name: "sun" }, { display: "🍎", name: "apple" }, { display: "🐱", name: "cat" }, { display: "⚽", name: "ball" },
            { display: "⚽", name: "ball" }, { display: "🍎", name: "apple" }, { display: "☀️", name: "sun" }, { display: "🐶", name: "dog" }, { display: "🐱", name: "cat" },
            { display: "🐱", name: "cat" }, { display: "⚽", name: "ball" }, { display: "🐶", name: "dog" }, { display: "☀️", name: "sun" }, { display: "🍎", name: "apple" },
            { display: "☀️", name: "sun" }, { display: "🐶", name: "dog" }, { display: "🐱", name: "cat" }, { display: "🍎", name: "apple" }, { display: "⚽", name: "ball" },
          ],
        },
      ],
    },

    memory: {
      levels: [
        { id: "L1", label: "Level 1", sequences: [[4, 7], [2, 8], [5, 1]] },
        { id: "L2", label: "Level 2", sequences: [[3, 6, 2], [7, 4, 9], [5, 2, 8]] },
        { id: "L3", label: "Level 3", sequences: [[4, 1, 7, 3], [8, 2, 5, 9]] },
      ],
    },
  },

  /* ===================================================== AGE 8–10 */
  "8-10": {
    handwriting: {
      intro: HANDWRITING_INTRO,
      tasks: [
        {
          id: "H1",
          title: "H1 – Copying",
          instruction: H1_INSTRUCTION,
          selectLabel: "Passage used",
          metaKey: "selected_passage",
          options: [
            { id: "1", label: "Passage 1", text: "On Saturday morning, Rahul went to the park with his sister. They saw many birds near the pond and played under a large tree." },
            { id: "2", label: "Passage 2", text: "After school, Arjun went to the playground with his friends. They played football for a while and then sat under a shady tree to drink some water." },
            { id: "3", label: "Passage 3", text: "Last weekend, Ananya visited the library with her mother. She found an interesting book about animals and spent some time reading it quietly." },
          ],
        },
        {
          id: "H2",
          title: "H2 – Dictation",
          instruction: H2_INSTRUCTION,
          note: "Read the sentence aloud. Do not record your voice. Spelling is not evaluated.",
          selectLabel: "Sentence used",
          metaKey: "selected_sentence",
          options: [
            { id: "1", label: "Sentence 1", text: "The children walked to school together." },
            { id: "2", label: "Sentence 2 (age 10)", text: "The students carefully completed their science project before the school exhibition." },
          ],
        },
        {
          id: "H3",
          title: "H3 – Independent Writing",
          instruction: "Write three or four sentences about a memorable day.",
          note: "If the child cannot produce sentences, follow the approved research protocol.",
          options: [],
        },
      ],
    },

    reading: {
      instruction: "Please read this passage aloud.",
      passages: [
        { id: "A", text: "Our school has a small garden. The students water the plants every morning. There are roses, sunflowers, and tomato plants. Everyone was excited." },
        { id: "B", text: "It started raining while Sara was getting ready for school. She packed her books in her bag. The roads were wet, but she reached school safely with her brother." },
      ],
    },

    phonological: {
      sections: [
        { id: "PA1", title: "Letter / Sound", instruction: "Show the letters. Ask: \"What sound do these letters make?\"",
          items: ["sh", "ch", "th", "ck", "ph"] },
        { id: "PA3", title: "Rhyming", instruction: "Say both words. Ask: \"Do these words rhyme?\"",
          items: ["light / night", "tree / free", "chair / bear", "house / mouse", "book / sun"] },
        { id: "PA4", title: "Initial Sound", instruction: "Say the word. Ask: \"What is the first sound?\"",
          items: ["plant", "school", "green", "train", "clock"] },
        { id: "PA5", title: "Final Sound", instruction: "Say the word. Ask: \"What is the last sound?\"",
          items: ["milk", "hand", "fish", "lamp", "boat"] },
        { id: "PA6", title: "Blending", instruction: "Say the sounds. Ask: \"What word do these sounds make?\"",
          items: ["/s/ /t/ /o/ /p/", "/f/ /l/ /a/ /g/", "/c/ /r/ /a/ /b/", "/s/ /p/ /i/ /n/", "/b/ /r/ /i/ /ck/"] },
        { id: "PA7", title: "Segmentation", instruction: "Say the word. Ask: \"Tell me each sound in this word.\"",
          items: ["cat", "fish", "map", "stop", "flag"] },
        { id: "PA8", title: "Phoneme Deletion", instruction: "Ask: \"Say the word without this sound.\"",
          items: ["cat without /k/", "plane without /p/", "stop without /s/", "smile without /s/", "train without /t/"] },
        { id: "PA9", title: "Phoneme Substitution", instruction: "Ask: \"Change this sound. What is the new word?\"",
          items: ["map: /m/ → /t/", "cat: /c/ → /h/", "pan: /p/ → /m/", "bat: /b/ → /h/", "sun: /s/ → /r/"] },
      ],
    },

    ran: {
      tasks: [
        {
          id: "T01",
          title: "Numbers",
          instruction: "Look at the numbers and say their names from left to right, as quickly as you can.",
          columns: 5,
          stimuli: [
            "2", "6", "9", "4", "7",
            "9", "4", "2", "7", "6",
            "7", "2", "6", "9", "4",
            "4", "9", "7", "6", "2",
            "6", "7", "4", "2", "9",
          ].map((d) => ({ display: d, name: d })),
        },
      ],
    },

    memory: {
      levels: [
        { id: "L1", label: "3 digits", sequences: [[4, 8, 2], [7, 1, 5], [3, 9, 6]] },
        { id: "L2", label: "4 digits", sequences: [[5, 2, 8, 4], [7, 3, 1, 9], [6, 4, 9, 2]] },
        { id: "L3", label: "5 digits", sequences: [[3, 8, 1, 6, 4], [9, 2, 5, 7, 3]] },
        { id: "L4", label: "6 digits", sequences: [[4, 7, 2, 9, 1, 5], [8, 3, 6, 1, 4, 7]] },
      ],
    },
  },

  /* ===================================================== AGE 11–13 */
  "11-13": {
    handwriting: {
      intro: HANDWRITING_INTRO,
      tasks: [
        {
          id: "H1",
          title: "H1 – Copying",
          instruction: H1_INSTRUCTION,
          selectLabel: "Passage used",
          metaKey: "selected_passage",
          options: [
            { id: "1", label: "Passage 1", text: "Technology has changed the way people communicate, learn, and work. Although digital devices are useful, strong reading and writing skills remain important because they help people express ideas clearly and understand information effectively." },
            { id: "2", label: "Passage 2", text: "Many students use computers and mobile devices for learning. While technology makes information easier to access, students should also develop good study habits and learn how to use digital resources responsibly." },
            { id: "3", label: "Passage 3", text: "Protecting the environment is everyone's responsibility. Simple actions such as saving water, reducing waste, and planting trees can make a difference and help create a healthier place for future generations." },
          ],
        },
        {
          id: "H2",
          title: "H2 – Dictation",
          instruction: H2_INSTRUCTION,
          note: "Read the sentence aloud. Do not record your voice. Spelling is not evaluated.",
          selectLabel: "Sentence used",
          metaKey: "selected_sentence",
          options: [
            { id: "1", label: "Sentence 1", text: "Regular practice can improve both accuracy and confidence when learning a new skill." },
          ],
        },
        {
          id: "H3",
          title: "H3 – Independent Writing",
          instruction: "Write five or six sentences about one change you would like to see in your school or community. Explain your reasons.",
          note: "If the child cannot produce sentences, follow the approved research protocol.",
          options: [],
        },
      ],
    },

    reading: {
      instruction: "Please read this passage aloud.",
      passages: [
        { id: "A", text: "Reading helps us learn new things and understand different ideas. It can improve our vocabulary and help us express our thoughts clearly. Reading regularly also makes it easier to understand difficult texts and unfamiliar words." },
        { id: "B", text: "Regular exercise keeps our body healthy and gives us more energy. Activities such as walking, cycling, and playing sports can improve fitness. Exercise can also help students feel relaxed and concentrate better while studying." },
      ],
    },

    phonological: {
      sections: [
        { id: "PA7", title: "Segmentation", instruction: "Say the word. Ask: \"Tell me each sound in this word.\"",
          items: ["plant", "bright", "school", "spring", "street"] },
        { id: "PA8", title: "Phoneme Deletion", instruction: "Ask: \"Say the word without this sound.\"",
          items: ["street without /s/", "splash without /s/", "plane without /p/", "bright without /b/", "train without /t/"] },
        { id: "PA9", title: "Phoneme Substitution", instruction: "Ask: \"Change this sound. What is the new word?\"",
          items: ["bright: first sound → /f/", "clap: first sound → /s/", "train: first sound → /b/", "light: first sound → /m/", "cat: final sound → /p/"] },
      ],
    },

    ran: {
      tasks: [
        {
          id: "T01",
          title: "Numbers and Letters",
          instruction: "Look at the numbers and letters and say their names from left to right, as quickly as you can.",
          columns: 5,
          stimuli: [
            "2", "A", "7", "S", "4",
            "D", "9", "O", "2", "P",
            "7", "S", "4", "A", "9",
            "P", "2", "D", "7", "O",
            "4", "O", "9", "P", "S",
          ].map((d) => ({ display: d, name: d })),
        },
      ],
    },

    memory: {
      levels: [
        { id: "L1", label: "3 digits", sequences: [[7, 2, 9], [4, 8, 3]] },
        { id: "L2", label: "4 digits", sequences: [[6, 1, 9, 4], [3, 7, 2, 8]] },
        { id: "L3", label: "5 digits", sequences: [[8, 4, 1, 6, 3], [2, 9, 5, 7, 4]] },
        { id: "L4", label: "6 digits", sequences: [[7, 3, 9, 1, 5, 2], [4, 8, 2, 6, 9, 3]] },
      ],
    },
  },

  /* ===================================================== AGE 14–15 */
  "14-15": {
    handwriting: {
      intro: HANDWRITING_INTRO,
      tasks: [
        {
          id: "H1",
          title: "H1 – Copying",
          instruction: H1_INSTRUCTION,
          selectLabel: "Passage used",
          metaKey: "selected_passage",
          options: [
            { id: "1", label: "Passage 1", text: "People increasingly depend on digital technology for communication, education, and access to information. However, the ability to organize ideas and communicate clearly through writing remains an important academic and practical skill." },
            { id: "2", label: "Passage 2", text: "The rapid development of technology has transformed many aspects of everyday life. While digital tools provide convenient ways to learn and communicate, students must also develop responsible habits when using technology and accessing information online." },
            { id: "3", label: "Passage 3", text: "Reading different types of literature allows students to explore unfamiliar ideas and perspectives. It can improve vocabulary and communication skills while encouraging readers to think carefully about the experiences and opinions of other people." },
          ],
        },
        {
          id: "H2",
          title: "H2 – Dictation",
          instruction: H2_INSTRUCTION,
          note: "Read the sentence aloud. Do not record your voice. Spelling is not evaluated.",
          selectLabel: "Sentence used",
          metaKey: "selected_sentence",
          options: [
            { id: "1", label: "Sentence 1", text: "Effective communication requires people to organize their thoughts clearly and express them accurately." },
          ],
        },
        {
          id: "H3",
          title: "H3 – Independent Writing",
          instruction: "Write a short paragraph explaining whether you think technology has improved the way students learn. Give at least two reasons for your opinion.",
          note: "If the child cannot produce sentences, follow the approved research protocol.",
          options: [],
        },
      ],
    },

    reading: {
      instruction: "Please read this passage aloud.",
      passages: [
        { id: "A", text: "Technology has changed the way students learn. Online resources provide quick access to information, but students must learn to identify reliable sources. Using technology effectively requires both curiosity and the ability to manage distractions." },
        { id: "B", text: "Mistakes are a natural part of learning. When students understand why an answer is wrong, they can change their approach and try again. Careful practice and useful feedback can gradually improve their skills and confidence." },
      ],
    },

    phonological: {
      sections: [
        { id: "PA9", title: "Phoneme Manipulation", instruction: "Read the instruction to the child.",
          items: [
            "Remove first sound from \"spring\"",
            "Remove first sound from \"street\"",
            "Change first sound of \"glowing\" to /k/",
            "Change first sound of \"bright\" to /f/",
            "Change final sound of \"plant\" to /k/",
          ] },
        { id: "PA7", title: "Advanced Segmentation", instruction: "Say the word. Ask: \"Tell me each sound in this word.\"",
          items: ["strength", "spring", "splash", "bright", "transport"] },
      ],
    },

    ran: {
      tasks: [
        {
          id: "T01",
          title: "Numbers",
          instruction: "Look at the numbers and say their names from left to right, as quickly as you can.",
          columns: 4,
          stimuli: [
            "2", "5", "7", "9",
            "7", "9", "2", "5",
            "5", "2", "9", "7",
            "9", "7", "5", "2",
            "2", "9", "5", "7",
          ].map((d) => ({ display: d, name: d })),
        },
        {
          id: "T02",
          title: "Letters",
          instruction: "Look at the letters and say their names from left to right, as quickly as you can.",
          columns: 4,
          stimuli: [
            "A", "E", "K", "M",
            "K", "M", "A", "E",
            "E", "A", "M", "K",
            "M", "K", "E", "A",
            "A", "M", "E", "K",
          ].map((d) => ({ display: d, name: d })),
        },
        {
          id: "T03",
          title: "Colours",
          instruction: "Look at the colours and say their names from left to right, as quickly as you can.",
          columns: 4,
          stimuli: [
            "Red", "Blue", "Green", "Yellow",
            "Green", "Yellow", "Red", "Blue",
            "Blue", "Red", "Yellow", "Green",
            "Yellow", "Green", "Blue", "Red",
            "Red", "Yellow", "Blue", "Green",
          ].map((c) => ({ colour: RAN_COLOURS[c], name: c })),
        },
      ],
    },

    // Same sequences as 11–13 (as specified in the protocol).
    memory: null, // filled in below
  },
};
assessmentData["14-15"].memory = assessmentData["11-13"].memory;

/*
 * Memory conditions. Both conditions use the same sequences.
 * The instruction is read aloud by the assessor.
 */
const memoryConditions = [
  { id: "FORWARD", title: "Forward Digit Recall",
    instruction: "Say: \"I will say some numbers. Say them back to me in the same order.\"" },
  { id: "BACKWARD", title: "Backward Digit Recall",
    instruction: "Say: \"I will say some numbers. Say them back to me backwards, starting from the last one.\"" },
];

/*
 * ===================================================== SESSION 2
 *
 * Session 2 (Follow-up Assessment) questions go here.
 *
 * Each age group can contain any of the modules used above
 * (handwriting, reading, phonological, ran, memory) in EXACTLY the same
 * format as assessmentData. Modules present here are shown; if an age group
 * is empty, the placeholder page below is shown instead.
 *
 * Example (to add a reading task for 8–10):
 *
 *   "8-10": {
 *     reading: {
 *       instruction: "Please read this passage aloud.",
 *       passages: [ { id: "A", text: "..." } ],
 *     },
 *   },
 */
const session2Data = {
  placeholder: {
    title: "Follow-up Assessment",
    message: "Questions for Session 2 will be added here.",
  },
  "5-7": {},
  "8-10": {},
  "11-13": {},
  "14-15": {},
};

/* Order in which modules appear in a session. */
const MODULE_ORDER = ["handwriting", "reading", "phonological", "ran", "memory"];

const MODULE_TITLES = {
  handwriting: "Handwriting",
  reading: "Reading",
  phonological: "Phonological Awareness",
  ran: "Rapid Automatized Naming (RAN)",
  memory: "Memory",
};

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
  if (session === "S02") return session2Data[group] || {};
  return assessmentData[group] || {};
}
