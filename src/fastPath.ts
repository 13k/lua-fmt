import { Chunk, Node } from "luaparse";

import { Doc } from "./docBuilder";
import { isNode, isNodeArray } from "./util";

export type Callback = (path: FastPath) => Doc;
export type CallbackForEach = (path: FastPath, index: number) => void;
export type CallbackMap = (path: FastPath, index: number) => Doc;

type StackItem = number | string | Node | Node[];

export class FastPath {
  private stack: StackItem[];

  public constructor(ast: Chunk) {
    this.stack = [ast];
  }

  public getValue(): StackItem | null {
    return this.stack[this.stack.length - 1];
  }

  public getNodeAtDepth(depth: number): StackItem | null {
    for (let i = this.stack.length - 1; i >= 0; i -= 2) {
      const value = this.stack[i];

      if (isNode(value) && --depth < 0) {
        return value;
      }
    }

    return null;
  }

  public getParent(depth = 0): StackItem | null {
    return this.getNodeAtDepth(depth + 1);
  }

  public call(callback: Callback, field: string): Doc {
    const node = this.getValue();
    const origLength = this.stack.length;

    this.stack.push(field, node[field]);
    const result = callback(this);
    this.stack.length = origLength;

    return result;
  }

  public forEach(callback: CallbackForEach, field?: string): void {
    let value = this.getValue();

    const origLength = this.stack.length;

    if (field) {
      value = value[field];
      this.stack.push(value);
    }

    if (!Array.isArray(value)) return;

    for (let i = 0; i < value.length; ++i) {
      this.stack.push(i, value[i]);
      callback(this, i);
      this.stack.length -= 2;
    }

    this.stack.length = origLength;
  }

  public map(callback: (path: FastPath, index: number) => Doc, field: string): Doc[] {
    const value = this.getValue()[field];

    if (!Array.isArray(value)) return [];

    const result: Doc[] = [];
    const origLength = this.stack.length;

    this.stack.push(field, value);

    value.forEach((val, i) => {
      this.stack.push(i, val);
      result.push(callback(this, i));
      this.stack.length -= 2;
    });

    this.stack.length = origLength;

    return result;
  }

  public needsParens(): boolean {
    const parent = this.getParent() as Node;
    const value = this.getValue() as Node;

    if (parent) {
      /*
        If this UnaryExpression is nested below another UnaryExpression, wrap the nested
        expression in parens. This not only improves readability of complex expressions, but also
        prevents `- -1` from becoming `--1`, which would result in a comment.
      */
      if (value.type === "UnaryExpression" && parent.type === "UnaryExpression") {
        return true;
      }
    }

    let inParens = false;

    switch (value.type) {
      case "BinaryExpression":
      case "BooleanLiteral":
      case "CallExpression":
      case "Chunk":
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
        inParens = value.inParens || false;
    }

    return inParens;
  }
}
