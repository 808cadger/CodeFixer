(function attachCodeFixerEngine(global) {
  const DEMOS = {
    python: `def total(items):
    result = 0
    for item in items:
        result += item
    print("Total is", result
    return result

if total([1, 2, 3]) = 6:
    print("ok")
`,
    javascript: `function total(items) {
  let result = 0;
  for (let i = 0; i <= items.length; i++) {
    result += items[i];
  }
  console.log("Total is", result;
  return result;
}

if (total([1, 2, 3]) = 6) {
  console.log("ok");
}
`
  };

  const COMMON_RULES = [
    checkBalancedDelimiters,
    checkUnclosedQuotes
  ];

  const LANGUAGE_RULES = {
    python: [
      checkPythonMissingColon,
      checkPythonAssignmentInCondition,
      checkPythonIndentation,
      checkPythonRangeLenLoop
    ],
    javascript: [
      checkJavaScriptMissingSemicolon,
      checkJavaScriptAssignmentInCondition,
      checkJavaScriptOffByOneLoop,
      checkJavaScriptLooseEquality
    ]
  };

  function analyzeCode(code, language) {
    const normalizedLanguage = language === "javascript" ? "javascript" : "python";
    const context = createContext(code, normalizedLanguage);
    const diagnostics = [
      ...runRules(COMMON_RULES, context),
      ...runRules(LANGUAGE_RULES[normalizedLanguage], context)
    ].sort(byLineThenSeverity);
    const issues = diagnostics.filter((item) => item.severity === "error");
    const warnings = diagnostics.filter((item) => item.severity === "warning");
    const fix = issues.find((issue) => issue.fix && issue.fix.safe) || null;

    return {
      language: normalizedLanguage,
      diagnostics,
      issues,
      warnings,
      fix,
      explanation: explainResult(issues, warnings),
      testResult: runDemoTests(normalizedLanguage, issues, warnings)
    };
  }

  function runRules(rules, context) {
    return rules.flatMap((rule) => rule(context));
  }

  function createContext(code, language) {
    const lines = code.split("\n");
    return { code, language, lines };
  }

  function checkBalancedDelimiters(context) {
    const pairs = { "(": ")", "[": "]", "{": "}" };
    const opening = Object.keys(pairs);
    const closing = Object.values(pairs);
    const stack = [];
    let quote = null;
    let lineComment = false;

    for (let index = 0; index < context.code.length; index += 1) {
      const char = context.code[index];
      const prev = context.code[index - 1];
      const next = context.code[index + 1];

      if (char === "\n") {
        lineComment = false;
        continue;
      }
      if (!quote && !lineComment && context.language === "python" && char === "#") {
        lineComment = true;
        continue;
      }
      if (!quote && !lineComment && context.language === "javascript" && char === "/" && next === "/") {
        lineComment = true;
        index += 1;
        continue;
      }
      if (lineComment) continue;
      if (isQuote(char, context.language) && prev !== "\\") {
        quote = quote === char ? null : quote || char;
        continue;
      }
      if (quote) continue;
      if (opening.includes(char)) {
        stack.push({ char, index });
      } else if (closing.includes(char)) {
        const last = stack.pop();
        if (!last || pairs[last.char] !== char) {
          const expected = last ? pairs[last.char] : null;
          return [diagnostic({
            id: "mismatched-delimiter",
            title: "Mismatched bracket",
            line: lineFromIndex(context.code, last ? last.index : index),
            message: last
              ? `A ${last.char} was opened but this ${char} closed something else. Add ${expected} near the earlier statement.`
              : `This ${char} does not match the last opening bracket.`,
            confidence: 0.91,
            fix: last ? safeFix(`Add ${expected}`, (code) => insertBeforeLineEnd(code, last.index, expected)) : null
          })];
        }
      }
    }

    const last = stack.pop();
    if (!last) return [];
    const expected = pairs[last.char];
    return [diagnostic({
      id: "missing-closing-delimiter",
      title: "Missing closing bracket",
      line: lineFromIndex(context.code, last.index),
      message: `A ${last.char} was opened but never closed. Add ${expected} near the end of that statement.`,
      confidence: 0.94,
      fix: safeFix(`Add ${expected}`, (code) => insertBeforeLineEnd(code, last.index, expected))
    })];
  }

  function checkUnclosedQuotes(context) {
    const diagnostics = [];
    context.lines.forEach((line, index) => {
      const codeOnly = stripLineComment(line, context.language);
      quoteChars(context.language).forEach((quote) => {
        if (countUnescaped(codeOnly, quote) % 2 === 1) {
          diagnostics.push(diagnostic({
            id: "missing-quote",
            title: "Missing quote",
            line: index + 1,
            message: `This line starts a ${quote} quote but does not close it.`,
            confidence: 0.88,
            fix: safeFix(`Add ${quote}`, (code) => replaceLine(code, index, line + quote))
          }));
        }
      });
    });
    return diagnostics;
  }

  function checkPythonMissingColon(context) {
    return context.lines.flatMap((line, index) => {
      const trimmed = stripLineComment(line, "python").trim();
      const opensBlock = /^(if|for|while|def|class|elif|else|try|except|finally|with)\b/.test(trimmed);
      if (!opensBlock || trimmed.endsWith(":")) return [];
      return [diagnostic({
        id: "python-missing-colon",
        title: "Missing colon",
        line: index + 1,
        message: "Python needs a colon at the end of this line.",
        confidence: 0.97,
        fix: safeFix("Add colon", (code) => replaceLine(code, index, line + ":"))
      })];
    });
  }

  function checkPythonAssignmentInCondition(context) {
    return context.lines.flatMap((line, index) => {
      if (!/^\s*(if|elif|while)\s+/.test(line)) return [];
      const nextLine = line.replace(/([^=!<>])=([^=])/, "$1==$2");
      if (nextLine === line) return [];
      return [diagnostic({
        id: "assignment-in-condition",
        title: "Assignment inside condition",
        line: index + 1,
        message: "This uses one equals sign inside a condition. You probably meant to compare with two equals signs.",
        confidence: 0.86,
        fix: safeFix("Use ==", (code) => replaceLine(code, index, nextLine))
      })];
    });
  }

  function checkPythonIndentation(context) {
    return context.lines.flatMap((line, index) => {
      const firstText = line.search(/\S/);
      if (firstText <= 0 || firstText % 4 === 0) return [];
      return [diagnostic({
        id: "python-unusual-indentation",
        severity: "warning",
        title: "Unusual indentation",
        line: index + 1,
        message: "This line is indented by a number of spaces that is not a multiple of four.",
        confidence: 0.66
      })];
    });
  }

  function checkPythonRangeLenLoop(context) {
    if (!/for\s+\w+\s+in\s+range\(len\(/.test(context.code)) return [];
    return [diagnostic({
      id: "python-range-len-loop",
      severity: "warning",
      title: "Possible simpler loop",
      line: null,
      message: "This loop may be easier to read by looping over the items directly.",
      confidence: 0.58
    })];
  }

  function checkJavaScriptMissingSemicolon(context) {
    return context.lines.flatMap((line, index) => {
      const trimmed = stripLineComment(line, "javascript").trim();
      const needsSemicolon = /^(const|let|var)\s+\w+\s*=/.test(trimmed) || /^(return|console\.log)\b/.test(trimmed);
      if (!needsSemicolon || /[;{}]$/.test(trimmed)) return [];
      return [diagnostic({
        id: "javascript-missing-semicolon",
        title: "Missing semicolon",
        line: index + 1,
        message: "This statement is missing a semicolon. JavaScript can sometimes guess, but adding it is clearer.",
        confidence: 0.8,
        fix: safeFix("Add semicolon", (code) => replaceLine(code, index, line + ";"))
      })];
    });
  }

  function checkJavaScriptAssignmentInCondition(context) {
    return context.lines.flatMap((line, index) => {
      if (!/^\s*(if|while)\s*\(/.test(line)) return [];
      const nextLine = line.replace(/([^=!<>])=([^=])/, "$1===$2");
      if (nextLine === line) return [];
      return [diagnostic({
        id: "assignment-in-condition",
        title: "Assignment inside condition",
        line: index + 1,
        message: "This uses one equals sign inside a condition. You probably meant to compare values.",
        confidence: 0.85,
        fix: safeFix("Use ===", (code) => replaceLine(code, index, nextLine))
      })];
    });
  }

  function checkJavaScriptOffByOneLoop(context) {
    return context.lines.flatMap((line, index) => {
      if (!/for\s*\(.+<=\s*\w+\.length/.test(line)) return [];
      return [diagnostic({
        id: "javascript-off-by-one-loop",
        severity: "warning",
        title: "Possible off-by-one bug",
        line: index + 1,
        message: "Using <= with .length can read one item past the end of an array. Consider using < instead.",
        confidence: 0.7
      })];
    });
  }

  function checkJavaScriptLooseEquality(context) {
    return context.lines.flatMap((line, index) => {
      const codeOnly = stripLineComment(line, "javascript");
      if (!/[^=!]==[^=]/.test(codeOnly)) return [];
      return [diagnostic({
        id: "javascript-loose-equality",
        severity: "warning",
        title: "Loose equality",
        line: index + 1,
        message: "Double equals can hide type conversion bugs. For beginner code, triple equals is usually safer.",
        confidence: 0.62
      })];
    });
  }

  function runDemoTests(language, issues, warnings) {
    if (issues.length > 0) {
      return {
        status: "failed",
        checks: ["parse"],
        message: "Demo tests did not run because syntax issues need to be fixed first."
      };
    }
    if (warnings.length > 0) {
      return {
        status: "warning",
        checks: ["parse", "logic-review"],
        message: "Demo tests ran, but CodeFixer found logic patterns worth reviewing."
      };
    }
    return {
      status: "passed",
      checks: ["parse", "logic-review"],
      message: `Demo ${language} checks passed: syntax looks valid and no obvious logic warnings were found.`
    };
  }

  function explainResult(issues, warnings) {
    if (issues.length > 0) {
      const first = issues[0];
      return `${lineLabel(first)}${first.message}`;
    }
    if (warnings.length > 0) {
      return "No clear syntax error was found, but there are patterns that often cause bugs.";
    }
    return "No obvious syntax problems found. The code is ready for the demo test flow.";
  }

  function diagnostic(input) {
    return {
      id: input.id,
      severity: input.severity || "error",
      title: input.title,
      line: input.line,
      message: input.message,
      confidence: input.confidence,
      fix: input.fix || null
    };
  }

  function safeFix(label, apply) {
    return { label, apply, safe: true };
  }

  function byLineThenSeverity(left, right) {
    const leftLine = left.line || Number.MAX_SAFE_INTEGER;
    const rightLine = right.line || Number.MAX_SAFE_INTEGER;
    if (leftLine !== rightLine) return leftLine - rightLine;
    return left.severity === right.severity ? 0 : left.severity === "error" ? -1 : 1;
  }

  function isQuote(char, language) {
    return quoteChars(language).includes(char);
  }

  function quoteChars(language) {
    return language === "javascript" ? ["\"", "'", "`"] : ["\"", "'"];
  }

  function stripLineComment(line, language) {
    let quote = null;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      const prev = line[index - 1];
      if (isQuote(char, language) && prev !== "\\") {
        quote = quote === char ? null : quote || char;
        continue;
      }
      if (quote) continue;
      if (language === "python" && char === "#") return line.slice(0, index);
      if (language === "javascript" && char === "/" && next === "/") return line.slice(0, index);
    }
    return line;
  }

  function lineFromIndex(text, index) {
    return text.slice(0, index).split("\n").length;
  }

  function countUnescaped(text, char) {
    let count = 0;
    for (let index = 0; index < text.length; index += 1) {
      if (text[index] === char && text[index - 1] !== "\\") count += 1;
    }
    return count;
  }

  function replaceLine(code, lineIndex, nextLine) {
    const lines = code.split("\n");
    lines[lineIndex] = nextLine;
    return lines.join("\n");
  }

  function insertBeforeLineEnd(code, openIndex, value) {
    const nextNewline = code.indexOf("\n", openIndex);
    if (nextNewline === -1) return code + value;
    return code.slice(0, nextNewline) + value + code.slice(nextNewline);
  }

  function lineLabel(item) {
    return item.line ? `Line ${item.line}: ` : "";
  }

  global.CodeFixerEngine = {
    DEMOS,
    analyzeCode
  };
})(typeof window !== "undefined" ? window : globalThis);
