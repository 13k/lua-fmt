import { Chunk, Node, StringLiteral } from "luaparse";

import { printComments, printDanglingComments, printDanglingStatementComments } from "./comments";
import { Doc, concat, join, indent, hardline, softline, group, line } from "./docBuilder";
import { willBreak, propagateBreaks } from "./docUtils";
import { FastPath } from "./fastPath";
import { Options, getStringQuotemark, getAlternativeStringQuotemark, Quotemark } from "./options";
import { locEnd, isNextLineEmpty, hasNewLineInRange, isBlockNode } from "./util";

export type PrintFn = (path: FastPath) => Doc;

// Prints a sequence of statements with a newline separating them.
//
//     local a = 1
//     local b = 2
function printStatementSequence(path: FastPath, options: Options, print: PrintFn): Doc {
  const printed: Doc[] = [];

  path.forEach((statementPath) => {
    const parts = [print(statementPath)];

    if (
      isNextLineEmpty(options.sourceText, locEnd(statementPath.getValue())) &&
      !isLastStatement(path)
    ) {
      parts.push(hardline);
    }

    printed.push(concat(parts));
  });

  return join(hardline, printed);
}

// Same as printStatementSequence, however the statements are indented
function printIndentedStatementList(
  path: FastPath,
  options: Options,
  print: PrintFn,
  field: string
): Doc {
  const printedBody = path.call((bodyPath) => {
    return printStatementSequence(bodyPath, options, print);
  }, field);

  return indent(concat([hardline, printedBody]));
}

// Prints a comment present at the end of a statement leading to a block, which would otherwise fall
// into the body of the statement. Doing so might remove contextual information in the comment.
function printDanglingStatementComment(path: FastPath) {
  const comments = (path.getValue() as any).attachedComments;
  if (!comments) {
    return "";
  }

  return concat([printDanglingStatementComments(path), printDanglingComments(path)]);
}

function makeStringLiteral(raw: string, quotemark: Quotemark) {
  const preferredQuoteCharacter = getStringQuotemark(quotemark);
  const alternativeQuoteCharacter = getAlternativeStringQuotemark(
    quotemark === "single" ? "single" : "double"
  );

  const newString = raw.replace(/\\([\s\S])|(['"])/g, (match, escaped, quote) => {
    if (escaped === alternativeQuoteCharacter) {
      return escaped;
    }

    if (quote === preferredQuoteCharacter) {
      return "\\" + quote;
    }

    return match;
  });

  return preferredQuoteCharacter + newString + preferredQuoteCharacter;
}

function printStringLiteral(path: FastPath, options: Options): Doc {
  const literal = path.getValue() as StringLiteral;
  if (literal.type !== "StringLiteral") {
    throw new Error("printStringLiteral: Expected StringLiteral, got " + literal.type);
  }

  // Ignore raw string literals as they have no leading/trailing quotes.
  if (literal.raw.startsWith("[[") || literal.raw.startsWith("[=")) {
    return literal.raw;
  }

  // Strip off the leading and trailing quote characters from the raw string
  const raw = literal.raw.slice(1, -1);

  let preferredQuotemark = options.quotemark;
  const preferredQuoteCharacter = getStringQuotemark(preferredQuotemark);

  // If the string literal already contains the preferred quote character, then use the alternative to improve
  // potential readability issues.
  if (raw.includes(preferredQuoteCharacter)) {
    preferredQuotemark = preferredQuotemark === "single" ? "double" : "single";
  }

  return makeStringLiteral(raw, preferredQuotemark);
}

function isLastStatement(path: FastPath) {
  const parent = path.getParent() as Node;
  const node = path.getValue();

  return isBlockNode(parent) && parent.body[parent.body.length - 1] === node;
}

function printNodeChunk(
  node: Chunk,
  parts: Doc[],
  path: FastPath,
  options: Options,
  print: PrintFn
): Doc {
  parts.push(path.call((p) => printStatementSequence(p, options, print), "body"));
  parts.push(printDanglingComments(path, true));

  if (node.body.length > 0 || node.comments) {
    parts.push(hardline);
  }

  return concat(parts);
}

function printNode(path: FastPath, options: Options, print: PrintFn): Doc {
  const value = path.getValue();

  if (!value) return "";

  const parts: Doc[] = [];
  const node = value as Node;

  switch (node.type) {
    case "Chunk":
      return printNodeChunk(node, parts, path, options, print);

    // Statements
    case "LabelStatement":
      return concat(["::", path.call(print, "label"), "::"]);

    case "GotoStatement":
      return concat(["goto ", path.call(print, "label")]);

    case "BreakStatement":
      return "break";

    case "ReturnStatement":
      parts.push("return");

      if (node.arguments.length > 0) {
        parts.push(" ");
        parts.push(join(", ", path.map(print, "arguments")));
      }

      return concat(parts);

    case "WhileStatement":
      parts.push("while ");
      parts.push(path.call(print, "condition"));
      parts.push(" do");

      parts.push(printDanglingStatementComment(path));

      if (node.body.length) {
        parts.push(printIndentedStatementList(path, options, print, "body"));
      }

      parts.push(concat([hardline, "end"]));

      return concat(parts);

    case "DoStatement":
      parts.push("do");

      parts.push(printDanglingStatementComment(path));

      if (node.body.length) {
        parts.push(printIndentedStatementList(path, options, print, "body"));
      }

      parts.push(concat([hardline, "end"]));

      return concat(parts);

    case "RepeatStatement":
      parts.push("repeat");

      parts.push(printDanglingStatementComment(path));

      if (node.body.length) {
        parts.push(printIndentedStatementList(path, options, print, "body"));
      }

      parts.push(concat([hardline, "until "]));
      parts.push(path.call(print, "condition"));

      return concat(parts);

    case "LocalStatement":
    case "AssignmentStatement": {
      const left = [];

      if (node.type === "LocalStatement") {
        left.push("local ");
      }

      const shouldBreak = options.linebreakMultipleAssignments;

      left.push(
        indent(join(concat([",", shouldBreak ? hardline : line]), path.map(print, "variables")))
      );

      let operator = "";

      const right = [];
      if (node.init.length) {
        operator = " =";

        if (node.init.length > 1) {
          right.push(indent(join(concat([",", line]), path.map(print, "init"))));
        } else {
          right.push(join(concat([",", line]), path.map(print, "init")));
        }
      }

      // HACK: This definitely needs to be improved, as I'm sure TableConstructorExpression isn't
      // the only candidate that falls under this critera.
      //
      // Due to the nature of how groups break, if the TableConstructorExpression contains a newline
      // (and thusly breaks), the break will propagate all the way up to the group on the left of
      // the assignment. This results in the table's initial { character being moved to a separate
      // line.
      //
      // There's probably a much better way of doing this, but it works for now.
      const canBreakLine = node.init.some(
        (n) =>
          n != null && n.type !== "TableConstructorExpression" && n.type !== "FunctionDeclaration"
      );

      return group(
        concat([
          group(concat(left)),
          group(concat([operator, canBreakLine ? indent(line) : " ", concat(right)])),
        ])
      );
    }

    case "CallStatement":
      return path.call(print, "expression");

    case "FunctionDeclaration":
      if (node.isLocal) {
        parts.push("local ");
      }

      parts.push("function");

      if (node.identifier) {
        parts.push(" ", path.call(print, "identifier"));
      }

      parts.push(
        concat([
          "(",
          group(
            indent(concat([softline, join(concat([",", line]), path.map(print, "parameters"))]))
          ),
          ")",
        ])
      );

      parts.push(printDanglingStatementComment(path));

      if (node.body.length) {
        parts.push(printIndentedStatementList(path, options, print, "body"));
      }

      parts.push(hardline, "end");

      return concat(parts);

    case "ForNumericStatement":
      parts.push("for ");
      parts.push(path.call(print, "variable"));
      parts.push(" = ");
      parts.push(path.call(print, "start"));
      parts.push(", ");
      parts.push(path.call(print, "end"));

      if (node.step) {
        parts.push(", ");
        parts.push(path.call(print, "step"));
      }

      parts.push(" do");

      parts.push(printDanglingStatementComment(path));

      if (node.body.length) {
        parts.push(printIndentedStatementList(path, options, print, "body"));
      }

      parts.push(concat([hardline, "end"]));

      return concat(parts);

    case "ForGenericStatement":
      parts.push("for ");
      parts.push(join(", ", path.map(print, "variables")));
      parts.push(" in ");
      parts.push(join(", ", path.map(print, "iterators")));
      parts.push(" do");

      parts.push(printDanglingStatementComment(path));

      if (node.body.length) {
        parts.push(printIndentedStatementList(path, options, print, "body"));
      }

      parts.push(concat([hardline, "end"]));

      return concat(parts);

    case "IfStatement": {
      const printed: Doc[] = [];

      path.forEach((statementPath) => {
        printed.push(print(statementPath));
      }, "clauses");

      parts.push(join(hardline, printed));
      parts.push(concat([hardline, "end"]));

      return concat(parts);
    }

    // Clauses
    case "IfClause":
      parts.push(
        concat([
          "if ",
          group(concat([indent(concat([softline, path.call(print, "condition")])), softline])),
          " then",
        ])
      );

      parts.push(printDanglingStatementComment(path));

      if (node.body.length) {
        parts.push(printIndentedStatementList(path, options, print, "body"));
      }

      return concat(parts);

    case "ElseifClause":
      parts.push(
        concat([
          "elseif ",
          group(concat([indent(concat([softline, path.call(print, "condition")])), softline])),
          " then",
        ])
      );

      parts.push(printDanglingStatementComment(path));

      if (node.body.length) {
        parts.push(printIndentedStatementList(path, options, print, "body"));
      }

      return concat(parts);

    case "ElseClause":
      parts.push("else");

      parts.push(printDanglingStatementComment(path));

      if (node.body.length) {
        parts.push(printIndentedStatementList(path, options, print, "body"));
      }

      return concat(parts);

    // Literals
    case "BooleanLiteral":
      return node.raw;

    case "NilLiteral":
      return "nil";

    case "NumericLiteral":
      return node.raw;

    case "StringLiteral":
      return printStringLiteral(path, options);

    case "VarargLiteral":
      return "...";

    case "Identifier":
      return node.name;

    // Expressions
    case "BinaryExpression":
    case "LogicalExpression": {
      const parent = path.getParent() as Node;
      const shouldGroup =
        parent.type !== node.type && node.left.type !== node.type && node.right.type !== node.type;

      const right = concat([node.operator, line, path.call(print, "right")]);

      return group(
        concat([
          path.call(print, "left"),
          indent(concat([" ", shouldGroup ? group(right) : right])),
        ])
      );
    }

    case "UnaryExpression":
      parts.push(node.operator);

      if (node.operator === "not") {
        parts.push(" ");
      }

      parts.push(path.call(print, "argument"));

      return concat(parts);

    case "MemberExpression":
      return concat([path.call(print, "base"), node.indexer, path.call(print, "identifier")]);

    case "IndexExpression":
      return concat([
        path.call(print, "base"),
        "[",
        group(concat([indent(concat([softline, path.call(print, "index")])), softline])),
        "]",
      ]);

    case "CallExpression": {
      const printedCallExpressionArgs = path.map(print, "arguments");

      // TODO: We should implement prettier's conditionalGroup construct to try and fit the most
      // appropriately fitting combination of argument layout. I.e: If all arguments but the last
      // fit on the same line, and the last argument is a table, it would be beneficial to break on
      // the table, rather than breaking the entire argument list.

      return concat([
        path.call(print, "base"),
        group(
          concat([
            "(",
            indent(concat([softline, join(concat([",", line]), printedCallExpressionArgs)])),
            softline,
            ")",
          ]),
          printedCallExpressionArgs.some(willBreak)
        ),
      ]);
    }

    case "TableCallExpression":
      parts.push(path.call(print, "base"));
      parts.push(" ");
      parts.push(path.call(print, "arguments"));

      return concat(parts);

    case "StringCallExpression":
      parts.push(path.call(print, "base"));
      parts.push(" ");
      parts.push(path.call(print, "argument"));

      return concat(parts);

    case "TableConstructorExpression": {
      if (node.fields.length === 0) {
        return "{}";
      }

      const fields: Doc[] = [];
      let separatorParts: Doc[] = [];

      path.forEach((childPath) => {
        fields.push(concat(separatorParts));
        fields.push(group(print(childPath)));

        separatorParts = [",", line];
      }, "fields");

      // If the user has placed their own linebreaks in the table, they probably want them to be
      // preserved
      const shouldBreak = hasNewLineInRange(options.sourceText, node.range[0], node.range[1]);

      return group(
        concat(["{", indent(concat([softline, concat(fields)])), softline, "}"]),
        shouldBreak
      );
    }

    case "TableKeyString":
      return concat([path.call(print, "key"), " = ", path.call(print, "value")]);

    case "TableKey":
      return concat(["[", path.call(print, "key"), "]", " = ", path.call(print, "value")]);

    case "TableValue":
      return path.call(print, "value");
  }

  throw Error("Unhandled AST node: " + node.type);
}

function printNodeParens(path: FastPath, options: Options, print: PrintFn): Doc {
  const printed = printNode(path, options, print);

  const parts = [];
  const needsParens = path.needsParens();

  if (needsParens) {
    parts.push("(");
  }

  parts.push(printed);

  if (needsParens) {
    parts.push(")");
  }

  return concat(parts);
}

export function buildDocFromAst(ast: Chunk, options: Options): Doc {
  const printNodeWithComments = (path: FastPath): Doc => {
    return printComments(path, options, (p) => printNodeParens(p, options, printNodeWithComments));
  };

  const doc = printNodeWithComments(new FastPath(ast));

  propagateBreaks(doc);

  return doc;
}
