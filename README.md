# Science Vocabulary Explorer

An interactive digital dictionary that helps students look back at the vocabulary from our OpenSciEd units.

Each word is shown as a **Frayer Model** (Definition, Key Characteristics, Examples, Non-Examples) along with:

- 🖼️ an optional image / mini-sim idea
- 🧲 an interactive magnet mini-sim prototype on the **magnet** entry
- 🔗 **Related Words: Cause & Effect** – shows what a word *causes*, what *causes it*, which system it is *part of*, and other connections. Related words that have their own entry are clickable.
- 🧠 **Check Your Understanding!** – a multiple-choice question with instant feedback
- ✍️ **Put it in Practice!** – a writing prompt (answers are saved in the student's browser only)

Students can switch units, jump to any lesson with **Quick Navigation**, search every word, or browse **All Words A–Z**.

## Opening the site

No installation is needed. Either:

- double-click `index.html` to open it in a browser, or
- publish it with GitHub Pages (Settings → Pages → Deploy from branch → `main` / root) and share the link with students.

## Adding vocabulary

All words live in the `data/` folder – one file per unit (for example `data/unit-8-3-forces-at-a-distance.js`).

- **New word in an existing lesson:** copy an existing block inside `terms: [ ... ]` and change the text.
- **New lesson:** copy a lesson block inside `lessons: [ ... ]` and change the `number`, `question`, word lists and terms. The Quick Navigation updates automatically.
- **New unit:** copy `data/TEMPLATE.js` to a new file in `data/`, fill it in, then add one line to `index.html` next to the other data files:

  ```html
  <script src="data/unit-8-4-your-unit.js"></script>
  ```

Words listed under `officialVocabulary` or `trickyWords` (or in `related`) that don't have a full entry yet are shown in grey and become clickable as soon as you add their Frayer Model.

### Images and visual searches

Images are optional. To add a Google Images link to a word, set `imageSearch` to a
specific search phrase, such as `"speaker spider diagram"`. Use `true` to search
for the word itself, or omit the field when images would not be helpful. The
link opens a new tab and requires internet access; Google controls the results.

To display an image directly on the page, add its path as `image`, for example
`"images/magnet-preview.svg"`. Use images you have permission to share and
provide any required attribution.

### Cause & effect relationships

Inside each term, list related words like this:

```js
related: [
  { word: "magnetic field", relationship: "causes", note: "A magnet creates an invisible magnetic field around itself." }
]
```

| `relationship` | Meaning (this word ___ related word) |
| -------------- | ------------------------------------ |
| `causes`       | this word causes / leads to it (cause → effect) |
| `caused-by`    | this word is caused by it |
| `part-of`      | this word is a part of it |
| `has-part`     | this word has it as a part |
| `related`      | connected in another way |

You only need to write a connection once – the other word's entry automatically shows the reverse (e.g. "magnet causes magnetic field" also appears on the *magnetic field* page as a cause).

### Checking your data

If you have [Node.js](https://nodejs.org) installed, run:

```sh
node scripts/validate-data.js
```

It reports typos such as missing definitions, duplicate words, a quiz `answer` that doesn't match a choice (`0` = A, `1` = B, …), unknown relationship types, or a data file that isn't listed in `index.html`.
