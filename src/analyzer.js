const CODEFIXER_DEMOS = {
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

function analyzeCode(code, language) {
  const issues = [];
  const warnings = [];

  checkBalancedDelimiters(code, issues);
  checkUnclosedQuotes(code, issues);

  if (language === "python") {
    analyzePython(code, issues, warnings);
  } else {
    analyzeJavaScript(code, issues, warnings);
  }

  const fixable = issues.find((issue) => issue.fix && issue.safe);
  return {
    issues,
    warnings,
    explanation: buildExplanation(issues, warnings),
    fix: fixable || null,
    testResult: runSimulatedTests(code, language, issues, warnings)
  };
}

function checkBalancedDelimiters(code, issues) {
  const pairs = { "(": ")", "[": "]", "{": "}" };
  const opening = Object.keys(pairs);
  const closing = Object.values(pairs);
  const stack = [];
  let quote = null;

  for (let index = 0; index < code.length; index += 1) {
    const char = code[index];
    const prev = code[index - 1];
    if ((char === "\"" || char === "'" || char === "`") && prev !== "\\") {
      quote = quote === char ? null : quote || char;
      continue;
    }
    if (quote) continue;
    if (opening.includes(char)) {
      stack.push({ char, index });
    } else if (closing.includes(char)) {
      const last = stack.pop();
      if (!last || pairs[last.char] !== char) {
        issues.push(makeIssue("Mismatched bracket", lineFromIndex(code, index), `This ${char} does not match the last opening bracket.`, null));
        return;
      }
    }
  }

  const last = stack.pop();
  if (last) {
    const expected = pairs[last.char];
    issues.push(makeIssue(
      "Missing closing bracket",
      lineFromIndex(code, last.index),
      `A ${last.char} was opened but never closed. Add ${expected} near the end of that statement.`,
      () => insertAfterLikelyLine(code, last.index, expected)
    ));
  }
}

function checkUnclosedQuotes(code, issues) {
  const lines = code.split("\n");
  lines.forEach((line, index) => {
    ["\"", "'"].forEach((quote) => {
      const count = countUnescaped(line, quote);
      if (count % 2 === 1) {
        issues.push(makeIssue(
          "Missing quote",
          index + 1,
          `This line starts a ${quote} quote but does not close it.`,
          () => replaceLine(code, index, line + quote)
        ));
      }
    });
  });
}

function analyzePython(code, issues, warnings) {
  const lines = code.split("\n");
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (/^(if|for|while|def|class|elif|else|try|except|finally|with)\b/.test(trimmed) && trimmed && !trimmed.endsWith(":")) {
      issues.push(makeIssue("Missing colon", index + 1, "Python needs a colon at the end of this line.", () => replaceLine(code, index, line + ":")));
    }
    if (/^\s*(if|elif|while)\s+.+[^=!<>]=[^=].*:/.test(line)) {
      issues.push(makeIssue("Assignment inside condition", index + 1, "This uses one equals sign inside a condition. You probably meant to compare with two equals signs.", () => replaceLine(code, index, line.replace(/([^=!<>])=([^=])/, "$1==$2"))));
    }
    if (line.startsWith(" ") && line.search(/\S/) % 4 !== 0) {
      warnings.push(makeWarning("Unusual indentation", index + 1, "This line is indented by a number of spaces that is not a multiple of four."));
    }
  });

  if (/for\s+\w+\s+in\s+range\(len\(/.test(code)) {
    warnings.push(makeWarning("Possible simpler loop", null, "This loop may be easier to read by looping over the items directly."));
  }
}

function analyzeJavaScript(code, issues, warnings) {
  const lines = code.split("\n");
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (/^(const|let|var)\s+\w+\s*=/.test(trimmed) && !/[;{]$/.test(trimmed)) {
      issues.push(makeIssue("Missing semicolon", index + 1, "This statement is missing a semicolon. JavaScript can sometimes guess, but adding it is clearer.", () => replaceLine(code, index, line + ";")));
    }
    if (/^\s*if\s*\(.+[^=!<>]=[^=].+\)/.test(line)) {
      issues.push(makeIssue("Assignment inside condition", index + 1, "This uses one equals sign inside an if statement. You probably meant to compare values.", () => replaceLine(code, index, line.replace(/([^=!<>])=([^=])/, "$1===$2"))));
    }
    if (/for\s*\(.+<=\s*\w+\.length/.test(line)) {
      warnings.push(makeWarning("Possible off-by-one bug", index + 1, "Using <= with .length can read one item past the end of an array. Consider using < instead."));
    }
  });
}

function runSimulatedTests(code, language, issues, warnings) {
  if (issues.length > 0) {
    return {
      status: "failed",
      message: "Demo tests did not run because syntax issues need to be fixed first."
    };
  }
  const suspicious = warnings.length > 0;
  return {
    status: suspicious ? "warning" : "passed",
    message: suspicious
      ? "Demo tests ran, but CodeFixer found logic patterns worth reviewing."
      : `Demo ${language} checks passed: syntax looks valid and no obvious logic warnings were found.`
  };
}

function buildExplanation(issues, warnings) {
  if (issues.length > 0) {
    const first = issues[0];
    return `Line ${first.line}: ${first.explanation}`;
  }
  if (warnings.length > 0) {
    return "No clear syntax error was found, but there are patterns that often cause bugs.";
  }
  return "No obvious syntax problems found. The code is ready for the demo test flow.";
}

function makeIssue(title, line, explanation, fix) {
  return {
    title,
    line,
    explanation,
    fix,
    safe: Boolean(fix)
  };
}

function makeWarning(title, line, explanation) {
  return { title, line, explanation };
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

function insertAfterLikelyLine(code, openIndex, value) {
  const nextNewline = code.indexOf("\n", openIndex);
  if (nextNewline === -1) return code + value;
  return code.slice(0, nextNewline) + value + code.slice(nextNewline);
}
