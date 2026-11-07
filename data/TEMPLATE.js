/*
 * TEMPLATE — copy this file to create a new unit (e.g. data/unit-8-4-my-unit.js),
 * then add a <script> tag for the new file in index.html, next to the other
 * data files. This template file itself is NOT loaded by the website.
 *
 * Relationship types for related words (read them as "THIS WORD ___ RELATED WORD"):
 *   "causes"    -> this word causes / leads to the related word      (cause -> effect)
 *   "caused-by" -> this word is caused by the related word            (effect <- cause)
 *   "part-of"   -> this word is a part of the related word
 *   "has-part"  -> this word has the related word as one of its parts
 *   "related"   -> the words are connected in another way
 *
 * Tip: you only need to write a relationship once. If "magnet" says it
 * "causes" "magnetic field", the "magnetic field" entry will automatically
 * show "is caused by magnet".
 */
window.VOCAB_DATA = window.VOCAB_DATA || { units: [] };

window.VOCAB_DATA.units.push({
  id: "8.X",                       // Unit number, must be unique
  title: "Unit Title",
  intro: "Short welcome paragraph for students.",
  lessons: [
    {
      number: 1,
      question: "Lesson driving question?",
      officialVocabulary: ["word one", "word two"],
      trickyWords: ["tricky one", "tricky two"],
      terms: [
        {
          word: "word one",
          definition: "Student-friendly definition.",
          characteristics: ["Key fact 1.", "Key fact 2."],
          examples: ["Example 1.", "Example 2."],
          nonExamples: ["Non-example 1.", "Non-example 2."],
          image: "",                // optional: path or URL to an image, e.g. "images/word-one.png"
          imageSearch: "word one science diagram", // optional: Google Images search query; true uses the word
          miniSimIdea: "",          // optional
          check: {
            question: "Check-your-understanding question?",
            choices: ["Choice A", "Choice B", "Choice C"],
            answer: 0,              // index of the correct choice (0 = A, 1 = B, 2 = C ...)
            explanation: "Why the correct answer is correct." // optional
          },
          practice: "Use the word ___ to explain ...",
          related: [
            { word: "word two", relationship: "causes", note: "Short explanation of the connection." }
          ]
        }
      ]
    }
  ]
});
