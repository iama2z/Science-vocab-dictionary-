/*
 * Science Vocabulary Explorer
 * Renders vocabulary data from window.VOCAB_DATA (see data/*.js).
 * No build step or server needed: open index.html in a browser.
 */
(function () {
  "use strict";

  var DATA = window.VOCAB_DATA || { units: [] };
  var units = DATA.units || [];

  /* Relationship types: label is read as "<this word> <label> <other word>". */
  var RELATIONSHIPS = {
    "causes":    { label: "causes",          inverse: "caused-by", group: "causes" },
    "caused-by": { label: "is caused by",    inverse: "causes",    group: "causedBy" },
    "part-of":   { label: "is part of",      inverse: "has-part",  group: "parts" },
    "has-part":  { label: "has part",        inverse: "part-of",   group: "parts" },
    "related":   { label: "is related to",   inverse: "related",   group: "related" }
  };

  var mainEl = document.getElementById("main");
  var unitSelect = document.getElementById("unit-select");
  var searchInput = document.getElementById("search");

  /* ---------- Helpers ---------- */

  function normalize(word) {
    return String(word || "").trim().toLowerCase();
  }

  function slugify(word) {
    return normalize(word).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function capitalize(word) {
    word = String(word || "");
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  /* Small DOM builder. Text is always inserted as text (never as HTML). */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key.indexOf("on") === 0 && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else node.setAttribute(key, value === true ? "" : value);
      });
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }

  /* ---------- Index all terms ---------- */

  var termIndex = {}; // slug -> { term, unit, lesson, links: [] }

  units.forEach(function (unit) {
    (unit.lessons || []).forEach(function (lesson) {
      (lesson.terms || []).forEach(function (term) {
        var slug = slugify(term.word);
        if (termIndex[slug]) {
          if (window.console) console.warn("Duplicate vocabulary word:", term.word);
          return;
        }
        termIndex[slug] = { term: term, unit: unit, lesson: lesson, links: [] };
      });
    });
  });

  // Build two-way links: if A "causes" B, B automatically shows "is caused by" A.
  Object.keys(termIndex).forEach(function (slug) {
    var entry = termIndex[slug];
    (entry.term.related || []).forEach(function (rel) {
      var type = RELATIONSHIPS[rel.relationship] ? rel.relationship : "related";
      addLink(entry, { word: rel.word, relationship: type, note: rel.note });

      var target = termIndex[slugify(rel.word)];
      if (target && target !== entry) {
        addLink(target, {
          word: entry.term.word,
          relationship: RELATIONSHIPS[type].inverse,
          note: rel.note
        });
      }
    });
  });

  function addLink(entry, link) {
    var key = slugify(link.word);
    var exists = entry.links.some(function (l) {
      return slugify(l.word) === key && l.relationship === link.relationship;
    });
    if (!exists) entry.links.push(link);
  }

  function findUnit(id) {
    for (var i = 0; i < units.length; i++) {
      if (String(units[i].id) === String(id)) return units[i];
    }
    return null;
  }

  /* ---------- Rendering: small pieces ---------- */

  function wordLink(word, className) {
    var slug = slugify(word);
    if (termIndex[slug]) {
      return el("a", { className: (className || "chip") + " chip-link", href: "#/term/" + slug, text: word });
    }
    return el("span", {
      className: (className || "chip") + " chip-pending",
      title: "Full entry coming soon",
      text: word
    });
  }

  function chipList(label, words, extraClass) {
    if (!words || !words.length) return null;
    return el("p", { className: "chip-row " + (extraClass || "") }, [
      el("strong", { text: label + ": " })
    ].concat(words.map(function (w) { return wordLink(w); })));
  }

  function bulletList(items) {
    if (!items || !items.length) return el("p", { className: "muted", text: "Coming soon." });
    return el("ul", null, items.map(function (item) { return el("li", { text: item }); }));
  }

  function frayerBox(title, content, className) {
    var box = el("section", { className: "frayer-box " + className }, [
      el("h4", null, [
        el("button", {
          type: "button",
          className: "frayer-toggle",
          "aria-expanded": "false",
          onClick: function (event) {
            var container = box.parentNode;
            var expanded = !box.classList.contains("expanded");
            container.classList.toggle("has-expanded", expanded);
            Array.prototype.forEach.call(container.children, function (sibling) {
              var isExpanded = sibling === box && expanded;
              sibling.classList.toggle("expanded", isExpanded);
              sibling.hidden = expanded && !isExpanded;
              sibling.querySelector(".frayer-toggle").setAttribute("aria-expanded", String(isExpanded));
            });
          }
        }, [title])
      ]),
      content
    ]);
    return box;
  }

  function renderFrayer(term) {
    return el("div", { className: "frayer" }, [
      frayerBox("Definition", el("p", { text: term.definition || "Coming soon." }), "frayer-definition"),
      frayerBox("Key Characteristics / Facts", bulletList(term.characteristics), "frayer-characteristics"),
      frayerBox("Examples", bulletList(term.examples), "frayer-examples"),
      frayerBox("Non-Examples", bulletList(term.nonExamples), "frayer-nonexamples")
    ]);
  }

  function renderMagnetMiniSim() {
    var flipped = false;
    var leftMagnet = el("div", { className: "sim-magnet", role: "img", "aria-label": "Left magnet, north pole on the left and south pole on the right" }, [
      el("span", { className: "sim-pole sim-north", text: "N" }),
      el("span", { className: "sim-pole sim-south", text: "S" })
    ]);
    var rightNorth = el("span", { className: "sim-pole sim-north", text: "N" });
    var rightSouth = el("span", { className: "sim-pole sim-south", text: "S" });
    var rightMagnet = el("div", { className: "sim-magnet", role: "img", "aria-label": "Right magnet, north pole on the left and south pole on the right" }, [
      rightNorth,
      rightSouth
    ]);
    var arrows = el("span", { className: "sim-force-arrows", "aria-hidden": "true" });
    var stage = el("div", { className: "sim-magnet-stage" }, [leftMagnet, arrows, rightMagnet]);
    var distance = el("input", {
      id: "magnet-sim-distance",
      type: "range",
      min: "0",
      max: "100",
      value: "55"
    });
    var status = el("p", { className: "sim-status", role: "status", "aria-live": "polite" });
    var flipButton = el("button", {
      className: "sim-button",
      type: "button",
      "aria-pressed": "false",
      onClick: function () {
        flipped = !flipped;
        flipButton.setAttribute("aria-pressed", String(flipped));
        update();
      }
    }, ["Flip right magnet"]);

    function update() {
      var leftFacing = "S";
      var rightFacing = flipped ? "S" : "N";
      var attract = leftFacing !== rightFacing;
      var distanceValue = Number(distance.value);
      var spacing = Math.round(distanceValue * 0.32);
      stage.style.setProperty("--sim-spacing", spacing + "px");
      rightNorth.textContent = flipped ? "S" : "N";
      rightSouth.textContent = flipped ? "N" : "S";
      rightMagnet.setAttribute("aria-label", "Right magnet, " +
        (flipped ? "south pole on the left and north pole on the right" : "north pole on the left and south pole on the right"));
      stage.classList.toggle("sim-attract", attract);
      stage.classList.toggle("sim-repel", !attract);
      arrows.textContent = attract ? "→   ←" : "←   →";
      status.textContent = (attract
        ? "Opposite poles (" + leftFacing + " and " + rightFacing + ") face each other, so the magnets attract."
        : "Like poles (" + leftFacing + " and " + rightFacing + ") face each other, so the magnets repel.") +
        (distanceValue < 30 ? " The magnets are close together." :
          distanceValue > 70 ? " The magnets are far apart." : " Move them closer to see the interaction more clearly.");
    }

    distance.addEventListener("input", update);
    update();

    return el("section", { className: "mini-sim", "aria-labelledby": "magnet-sim-title" }, [
      el("h4", { id: "magnet-sim-title", text: "Try the Magnet Mini-Sim" }),
      el("p", { className: "muted small", text: "Move the magnets closer or farther apart, then flip the right magnet to compare attraction and repulsion." }),
      stage,
      el("label", { className: "sim-slider-label", "for": distance.id }, ["Distance between magnets", distance]),
      el("div", { className: "sim-controls" }, [flipButton]),
      status
    ]);
  }

  function renderVisual(term) {
    if (!term.image && !term.imageSearch && !term.miniSimIdea && !term.miniSim) return null;
    return el("section", { className: "visual" }, [
      el("h4", { text: "Visuals" }),
      term.image ? el("img", { src: term.image, alt: "Illustration of " + term.word, loading: "lazy" }) : null,
      term.imageSearch ? el("p", null, [
        el("a", {
          href: "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(
            typeof term.imageSearch === "string" ? term.imageSearch : term.word
          ),
          target: "_blank",
          rel: "noopener noreferrer",
          text: "Find " + (term.image ? "more " : "") + "images of " + term.word + " on Google (opens in a new tab)"
        })
      ]) : null,
      term.miniSimIdea ? el("p", null, [el("strong", { text: "Mini-Sim Idea: " }), term.miniSimIdea]) : null,
      term.miniSim === "magnet-poles" ? renderMagnetMiniSim() : null
    ]);
  }

  function relationRow(fromWord, label, toWord, note, arrow) {
    return el("li", { className: "relation" }, [
      el("div", { className: "relation-chain" }, [
        wordLink(fromWord, "chip chip-word"),
        el("span", { className: "relation-arrow", "aria-hidden": "true", text: arrow }),
        el("span", { className: "relation-label", text: label }),
        el("span", { className: "relation-arrow", "aria-hidden": "true", text: arrow }),
        wordLink(toWord, "chip chip-word")
      ]),
      note ? el("p", { className: "relation-note", text: note }) : null
    ]);
  }

  function renderRelated(entry) {
    var links = entry.links;
    if (!links.length) return null;
    var word = entry.term.word;
    var groups = { causes: [], causedBy: [], parts: [], related: [] };

    links.forEach(function (link) {
      var info = RELATIONSHIPS[link.relationship];
      var row;
      if (link.relationship === "causes") {
        row = relationRow(word, "causes", link.word, link.note, "→");
      } else if (link.relationship === "caused-by") {
        // Show causes on the left so arrows always point from cause to effect.
        row = relationRow(link.word, "causes", word, link.note, "→");
      } else {
        row = relationRow(word, info.label, link.word, link.note, "—");
      }
      groups[info.group].push(row);
    });

    function group(title, hint, rows, className) {
      if (!rows.length) return null;
      return el("div", { className: "relation-group " + className }, [
        el("h5", { text: title }),
        el("p", { className: "muted small", text: hint }),
        el("ul", { className: "relation-list" }, rows)
      ]);
    }

    return el("section", { className: "related" }, [
      el("h4", { text: "Related Words: Cause & Effect" }),
      group("Effects: what " + word + " causes", "Cause → Effect", groups.causes, "group-causes"),
      group("Causes: what leads to " + word, "Cause → Effect", groups.causedBy, "group-caused-by"),
      group("Parts of a system", "How the pieces fit together", groups.parts, "group-parts"),
      group("Also connected", "Words that go together", groups.related, "group-related")
    ]);
  }

  function renderCheck(term, unit) {
    var check = term.check;
    if (!check || !check.choices || !check.choices.length) return null;
    var name = "check-" + slugify(unit.id) + "-" + slugify(term.word);

    if (!Number.isInteger(check.answer) || check.answer < 0 || check.answer >= check.choices.length) {
      return el("section", { className: "check" }, [
        el("h4", { text: "Check Your Understanding" }),
        el("p", { id: name, text: check.question }),
        el("ul", null, check.choices.map(function (choice, i) {
          return el("li", null, [String.fromCharCode(65 + i) + ") " + choice]);
        }))
      ]);
    }

    var feedback = el("p", { className: "feedback", role: "status", "aria-live": "polite" });
    var buttons = check.choices.map(function (choice, i) {
      var letter = String.fromCharCode(65 + i);
      return el("button", {
        type: "button",
        className: "choice",
        "data-index": String(i),
        onClick: function (event) {
          var btn = event.currentTarget;
          var correct = i === check.answer;
          btn.classList.add(correct ? "correct" : "incorrect");
          btn.setAttribute("aria-pressed", "true");
          if (correct) {
            buttons.forEach(function (b) { b.disabled = true; });
            feedback.className = "feedback feedback-correct";
            feedback.textContent = "Correct! " + (check.explanation || "");
          } else {
            btn.disabled = true;
            feedback.className = "feedback feedback-incorrect";
            feedback.textContent = "Not quite. Review the definition and try again.";
          }
        }
      }, [el("span", { className: "choice-letter", text: letter + ")" }), " " + choice]);
    });

    return el("section", { className: "check" }, [
      el("h4", { text: "Check Your Understanding" }),
      el("p", { id: name, text: check.question }),
      el("div", { className: "choices", role: "group", "aria-labelledby": name }, buttons),
      feedback
    ]);
  }

  function renderPractice(term, unit) {
    if (!term.practice) return null;
    var key = "vocab-practice:" + unit.id + ":" + slugify(term.word);
    var id = "practice-" + slugify(unit.id) + "-" + slugify(term.word);
    var status = el("span", { className: "muted small", "aria-live": "polite" });
    var box = el("textarea", { id: id, rows: "3", placeholder: "Write your answer here…" });
    box.value = storageGet(key) || "";
    box.addEventListener("input", function () {
      storageSet(key, box.value);
      status.textContent = "Saved on this device.";
    });
    return el("section", { className: "practice" }, [
      el("h4", { text: "Put it in Practice" }),
      el("label", { "for": id, text: term.practice }),
      box,
      status
    ]);
  }

  function renderTerm(entry) {
    var term = entry.term;
    var unit = entry.unit;
    var lesson = entry.lesson;
    return el("article", { className: "term-card", id: "term-" + slugify(term.word), tabindex: "-1" }, [
      el("header", { className: "term-header" }, [
        el("h2", { text: capitalize(term.word) }),
        el("a", {
          className: "term-location",
          href: "#/unit/" + encodeURIComponent(unit.id) + "/lesson/" + lesson.number,
          text: "Unit " + unit.id + " · Lesson " + lesson.number
        })
      ]),
      renderFrayer(term),
      renderVisual(term),
      renderRelated(entry),
      el("div", { className: "activities" }, [renderCheck(term, unit), renderPractice(term, unit)])
    ]);
  }

  /* ---------- Rendering: pages ---------- */

  function renderUnit(unit) {
    var lessons = (unit.lessons || []).slice().sort(function (a, b) { return a.number - b.number; });

    var nav = el("nav", { className: "lesson-nav", "aria-label": "Quick navigation" }, [
      el("h3", { text: "Quick Navigation" }),
      el("ul", null, lessons.map(function (lesson) {
        return el("li", null, [el("a", {
          href: "#/unit/" + encodeURIComponent(unit.id) + "/lesson/" + lesson.number,
          text: "Lesson " + lesson.number
        })]);
      }))
    ]);

    var intro = el("section", { className: "unit-intro" }, [
      el("h2", { text: "Unit " + unit.id + ": " + unit.title + " - Vocabulary Explorer" }),
      unit.intro ? el("p", { text: unit.intro }) : null,
      el("details", { className: "how-to" }, [
        el("summary", { text: "How to Use This Page" }),
        el("p", { text: "Open a word to explore its definition, characteristics, examples, and practice activities." }),
        el("p", { text: "Related words show cause-and-effect connections. Click a highlighted word to open its entry. Grey words don't have a full entry yet." })
      ])
    ]);

    var lessonSections = lessons.map(function (lesson) {
      var terms = (lesson.terms || []).map(function (t) { return termIndex[slugify(t.word)]; })
        .filter(function (entry) { return entry && entry.lesson === lesson; });
      return el("section", { className: "lesson", id: "lesson-" + unit.id + "-" + lesson.number }, [
        el("h2", { className: "lesson-title", text: "Lesson " + lesson.number + ": " + (lesson.question || "") }),
        chipList("Official Vocabulary", lesson.officialVocabulary, "official"),
        chipList("Tricky Words", lesson.trickyWords, "tricky"),
        terms.length ? el("p", { className: "chip-row" }, [
          el("strong", { text: "Word entries: " })
        ].concat(terms.map(function (entry) {
          return wordLink(entry.term.word);
        }))) : el("p", { className: "muted", text: "Word entries for this lesson are coming soon." })
      ]);
    });

    return el("div", { className: "unit-view" }, [intro, nav].concat(lessonSections));
  }

  function renderIndexPage() {
    var slugs = Object.keys(termIndex).sort();
    return el("div", { className: "az-view" }, [
      el("h2", { text: "All Words A–Z" }),
      el("ul", { className: "az-list" }, slugs.map(function (slug) {
        var entry = termIndex[slug];
        return el("li", null, [
          wordLink(entry.term.word, "chip chip-word"),
          el("span", { className: "muted small", text: " Unit " + entry.unit.id + ", Lesson " + entry.lesson.number })
        ]);
      }))
    ]);
  }

  function renderSearch(query) {
    var q = normalize(query);
    var exact = [];
    var partial = [];
    Object.keys(termIndex).sort().forEach(function (slug) {
      var entry = termIndex[slug];
      var t = entry.term;
      var word = normalize(t.word);
      if (word.indexOf(q) !== -1) {
        exact.push(entry);
        return;
      }
      var haystack = [t.definition]
        .concat(t.characteristics || [], t.examples || [], t.nonExamples || [])
        .concat(entry.links.map(function (l) { return l.word; }))
        .join(" ").toLowerCase();
      if (haystack.indexOf(q) !== -1) partial.push(entry);
    });

    // Words listed in lessons that don't have a full entry yet.
    var pending = [];
    units.forEach(function (unit) {
      (unit.lessons || []).forEach(function (lesson) {
        (lesson.officialVocabulary || []).concat(lesson.trickyWords || []).forEach(function (w) {
          if (!termIndex[slugify(w)] && normalize(w).indexOf(q) !== -1) {
            pending.push({ word: w, unit: unit, lesson: lesson });
          }
        });
      });
    });

    var results = exact.concat(partial);
    var children = [el("h2", { text: "Search results for \u201c" + query.trim() + "\u201d" })];
    if (!results.length && !pending.length) {
      children.push(el("p", { text: "No words found. Try a different spelling or a shorter word." }));
    }
    if (pending.length) {
      children.push(el("p", { className: "muted" }, ["Listed in a lesson (full entry coming soon): "].concat(
        pending.map(function (p) {
          return el("a", {
            className: "chip chip-pending",
            href: "#/unit/" + encodeURIComponent(p.unit.id) + "/lesson/" + p.lesson.number,
            text: p.word + " (Unit " + p.unit.id + ", L" + p.lesson.number + ")"
          });
        })
      )));
    }
    return el("div", { className: "search-view" }, children.concat(results.map(function (entry) {
      return el("p", { className: "search-result" }, [
        wordLink(entry.term.word, "chip chip-word"),
        el("span", { className: "muted small", text: " Unit " + entry.unit.id + ", Lesson " + entry.lesson.number })
      ]);
    })));
  }

  /* ---------- Routing ---------- */

  var currentUnit = units[0] || null;

  function getUnitTerms(unit) {
    return (unit.lessons || []).reduce(function (entries, lesson) {
      return entries.concat((lesson.terms || []).map(function (term) {
        return termIndex[slugify(term.word)];
      }).filter(Boolean));
    }, []);
  }

  function renderTermPage(entry) {
    var entries = getUnitTerms(entry.unit);
    var index = entries.indexOf(entry);
    var previous = index > 0 ? entries[index - 1] : null;
    var next = index >= 0 && index < entries.length - 1 ? entries[index + 1] : null;
    function navigation() {
      function termLink(target, label) {
        return target ? el("a", {
          className: "term-nav-link",
          href: "#/term/" + slugify(target.term.word),
          text: label + ": " + target.term.word
        }) : el("span", { className: "term-nav-link muted", text: label });
      }
      return el("nav", { className: "term-navigation", "aria-label": "Word navigation" }, [
        termLink(previous, "Previous"),
        el("a", {
          className: "term-nav-back",
          href: "#/unit/" + encodeURIComponent(entry.unit.id) + "/lesson/" + entry.lesson.number,
          text: "Back to Lesson " + entry.lesson.number
        }),
        termLink(next, "Next")
      ]);
    }
    return el("div", { className: "term-view" }, [navigation(), renderTerm(entry), navigation()]);
  }

  function populateUnitSelect() {
    unitSelect.innerHTML = "";
    units.forEach(function (unit) {
      unitSelect.appendChild(el("option", { value: unit.id, text: "Unit " + unit.id + ": " + unit.title }));
    });
    unitSelect.appendChild(el("option", { value: "__az", text: "All Words A–Z" }));
  }

  function show(node, focusId) {
    mainEl.innerHTML = "";
    mainEl.appendChild(node);
    if (focusId) {
      var target = document.getElementById(focusId);
      if (target) {
        target.scrollIntoView({ block: "start" });
        if (target.classList.contains("term-card")) {
          target.classList.add("highlight");
          target.focus({ preventScroll: true });
        }
        return;
      }
    }
    window.scrollTo(0, 0);
  }

  function route() {
    if (!units.length) {
      show(el("p", { text: "No vocabulary data found. Make sure the data files are listed in index.html." }));
      return;
    }

    var parts = window.location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);

    if (parts[0] === "az") {
      unitSelect.value = "__az";
      show(renderIndexPage());
      return;
    }

    if (parts[0] === "term" && termIndex[parts[1]]) {
      var entry = termIndex[parts[1]];
      currentUnit = entry.unit;
      unitSelect.value = currentUnit.id;
      show(renderTermPage(entry), "term-" + parts[1]);
      return;
    }

    if (parts[0] === "unit") currentUnit = findUnit(parts[1]) || currentUnit;
    unitSelect.value = currentUnit.id;
    var focus = parts[2] === "lesson" ? "lesson-" + currentUnit.id + "-" + parts[3] : null;
    show(renderUnit(currentUnit), focus);
  }

  populateUnitSelect();

  unitSelect.addEventListener("change", function () {
    searchInput.value = "";
    window.location.hash = unitSelect.value === "__az" ? "#/az" : "#/unit/" + encodeURIComponent(unitSelect.value);
  });

  searchInput.addEventListener("input", function () {
    if (normalize(searchInput.value)) show(renderSearch(searchInput.value));
    else route();
  });

  // Clicking a link to the page you're already on (e.g. from search results) still navigates.
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href^='#/']");
    if (link && link.getAttribute("href") === window.location.hash) {
      event.preventDefault();
      searchInput.value = "";
      route();
    }
  });

  window.addEventListener("hashchange", function () {
    searchInput.value = "";
    route();
  });

  route();
})();
