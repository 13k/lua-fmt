import { Node, Block } from "luaparse";

export function locStart(node: Node): number {
  return node.range[0];
}

export function locEnd(node: Node): number {
  return node.range[1];
}

export function isNode(value: any): value is Node {
  if (value == null) return false;

  switch ((<Node>value).type) {
    case "BinaryExpression":
    case "BooleanLiteral":
    case "CallExpression":
    case "FunctionDeclaration":
    case "Identifier":
    case "IndexExpression":
    case "LogicalExpression":
    case "MemberExpression":
    case "NilLiteral":
    case "NumericLiteral":
    case "StringCallExpression":
    case "StringLiteral":
    case "TableCallExpression":
    case "TableConstructorExpression":
    case "UnaryExpression":
    case "VarargLiteral":
    case "AssignmentStatement":
    case "BreakStatement":
    case "CallStatement":
    case "DoStatement":
    case "ElseClause":
    case "ElseifClause":
    case "ForGenericStatement":
    case "ForNumericStatement":
    case "GotoStatement":
    case "IfClause":
    case "IfStatement":
    case "LabelStatement":
    case "LocalStatement":
    case "RepeatStatement":
    case "ReturnStatement":
    case "WhileStatement":
    case "Chunk":
    case "Comment":
    case "TableKey":
    case "TableKeyString":
    case "TableValue":
      return true;
    default:
      return false;
  }
}

export function isBlockNode(value: any): value is Block {
  return isNode(value) && (<Block>value).body !== undefined;
}

export interface SearchOptions {
  searchBackwards?: boolean;
}

export function skipOnce(
  text: string,
  index: number,
  sequences: string[],
  options: SearchOptions = {}
): number {
  let skipCount = 0;

  sequences.forEach((seq) => {
    const searchText = options.searchBackwards
      ? text.substring(index - seq.length, index)
      : text.substring(index, index + seq.length);

    if (searchText === seq) {
      skipCount = seq.length;
      return;
    }
  });

  return index + (options.searchBackwards ? -skipCount : skipCount);
}

export function skipMany(
  text: string,
  index: number,
  sequences: string[],
  options: SearchOptions = {}
): number {
  let oldIdx = null;

  while (oldIdx !== index) {
    oldIdx = index;
    index = skipOnce(text, index, sequences, options);
  }

  return index;
}

export function skipNewLine(text: string, index: number, options: SearchOptions = {}): number {
  return skipOnce(text, index, ["\n", "\r\n"], options);
}

export function skipSpaces(text: string, index: number, options: SearchOptions = {}): number {
  return skipMany(text, index, [" ", "\t"], options);
}

export function skipToLineEnd(text: string, index: number, options: SearchOptions = {}): number {
  return skipMany(text, skipSpaces(text, index), [";"], options);
}

export function hasNewLine(text: string, index: number, options: SearchOptions = {}): boolean {
  const endOfLineIdx = skipSpaces(text, index, options);
  const nextLineIdx = skipNewLine(text, endOfLineIdx, options);

  return endOfLineIdx !== nextLineIdx;
}

export function hasNewLineInRange(text: string, start: number, end: number): boolean {
  return text.substr(start, end - start).indexOf("\n") !== -1;
}

export function isPreviousLineEmpty(text: string, index: number): boolean {
  index = skipSpaces(text, index, { searchBackwards: true });
  index = skipNewLine(text, index, { searchBackwards: true });
  index = skipSpaces(text, index, { searchBackwards: true });

  const previousLine = skipNewLine(text, index, { searchBackwards: true });

  return index !== previousLine;
}

export function skipTrailingComment(text: string, index: number): number {
  if (text.charAt(index) === "-" && text.charAt(index + 1) === "-") {
    index += 2;

    while (index >= 0 && index < text.length) {
      if (text.charAt(index) === "\n") {
        return index;
      }

      if (text.charAt(index) === "\r" && text.charAt(index + 1) === "\n") {
        return index;
      }

      index++;
    }
  }

  return index;
}

export function isNextLineEmpty(
  text: string,
  index: number,
  options: SearchOptions = {
    searchBackwards: false,
  }
): boolean {
  index = skipToLineEnd(text, index, options);

  let oldIdx = null;

  while (index !== oldIdx) {
    oldIdx = index;
    index = skipSpaces(text, index, options);
  }

  index = skipTrailingComment(text, index);
  index = skipNewLine(text, index, options);

  return hasNewLine(text, index);
}
