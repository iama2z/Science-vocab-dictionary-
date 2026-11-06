/*
 * Unit 8.3: Forces at a Distance
 *
 * To add more vocabulary, copy a lesson or term block below (or use
 * data/TEMPLATE.js) and fill it in. Run `node scripts/validate-data.js`
 * afterwards to check for typos or missing fields.
 */
window.VOCAB_DATA = window.VOCAB_DATA || { units: [] };

window.VOCAB_DATA.units.push({
  id: "8.3",
  title: "Forces at a Distance",
  emoji: "🧭",
  intro:
    "Welcome, scientists! This page is your home base for mastering the key vocabulary in our unit on magnetism and forces. Understanding these words is like having a toolkit—the more tools you have, the better you can build and explain scientific ideas.",
  lessons: [
    {
      number: 1,
      question: "What causes a speaker to vibrate?",
      officialVocabulary: ["magnet", "wire", "speaker", "spider"],
      trickyWords: ["vibrate", "system", "component", "dissect", "phenomenon"],
      terms: [
        {
          word: "magnet",
          definition:
            "An object that creates an invisible force field around itself that can pull (attract) or push (repel) on other magnets and certain metals like iron.",
          characteristics: [
            "Has two ends, called a north pole and a south pole.",
            "\"Opposites attract\" (North pulls South) and \"Likes repel\" (North pushes North).",
            "Creates an invisible magnetic field.",
            "Can be a permanent magnet (always on) or an electromagnet (can be switched on/off)."
          ],
          examples: [
            "A refrigerator magnet.",
            "A compass needle.",
            "The Earth itself (it has a magnetic north and south pole!).",
            "The permanent magnet used in our speaker."
          ],
          nonExamples: [
            "A piece of wood.",
            "A plastic cup.",
            "A glass window.",
            "An aluminum can."
          ],
          image: "",
          miniSimIdea:
            "An interactive where students can drag two bar magnets near each other and see the lines of force showing either attraction or repulsion when the poles are flipped.",
          check: {
            question: "A magnet will attract which of the following objects?",
            choices: ["A glass marble", "An iron paperclip", "A rubber eraser"],
            answer: 1,
            explanation:
              "Magnets attract certain metals like iron. Glass and rubber are not pulled by a magnet."
          },
          practice: "Use the word magnet to explain why a compass needle points north.",
          related: [
            {
              word: "magnetic field",
              relationship: "causes",
              note: "A magnet creates an invisible magnetic field around itself."
            },
            {
              word: "attract",
              relationship: "causes",
              note: "Opposite poles (North and South) pull toward each other."
            },
            {
              word: "repel",
              relationship: "causes",
              note: "Like poles (North and North, or South and South) push away from each other."
            },
            {
              word: "speaker",
              relationship: "part-of",
              note: "The permanent magnet is a key component of a speaker."
            },
            {
              word: "electromagnet",
              relationship: "related",
              note: "A kind of magnet that can be switched on and off."
            }
          ]
        }
      ]
    }
  ]
});
