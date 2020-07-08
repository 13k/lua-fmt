/* luaparse by: https://github.com/oxyc */
/* typing definition by: https://github.com/hydroper */
declare module "luaparse" {
  interface NodeAdditional {
    type: string;
    loc: MarkerLocations;
    range: [number, number];
  }

  export type Literal =
    | BooleanLiteral
    | NilLiteral
    | NumericLiteral
    | StringLiteral
    | VarargLiteral;

  export type Expression =
    | BinaryExpression
    | BooleanLiteral
    | CallExpression
    | FunctionDeclaration
    | Identifier
    | IndexExpression
    | LogicalExpression
    | MemberExpression
    | NilLiteral
    | NumericLiteral
    | StringCallExpression
    | StringLiteral
    | TableCallExpression
    | TableConstructorExpression
    | UnaryExpression
    | VarargLiteral;

  export type Statement =
    | AssignmentStatement
    | BreakStatement
    | CallStatement
    | DoStatement
    | ElseClause
    | ElseifClause
    | ForGenericStatement
    | ForNumericStatement
    | FunctionDeclaration
    | GotoStatement
    | IfClause
    | IfStatement
    | LabelStatement
    | LocalStatement
    | RepeatStatement
    | ReturnStatement
    | WhileStatement;

  export type Node =
    | Expression
    | Statement
    | Chunk
    | Comment
    | TableKey
    | TableKeyString
    | TableValue;

  export interface AssignmentStatementCtor {
    (
      variables: (Identifier | IndexExpression | MemberExpression)[],
      init: (Expression | null)[]
    ): AssignmentStatement;
  }

  export interface BinaryExpressionCtor {
    (operator: string, left: Expression, right: Expression): BinaryExpression;
  }

  export interface BreakStatementCtor {
    (): BreakStatement;
  }

  export interface CallExpressionCtor {
    (base: Expression, arguments: Expression[]): CallExpression;
  }

  export interface CallStatementCtor {
    (expression: Expression): CallStatement;
  }

  export interface ChunkCtor {
    (body: Statement[]): Chunk;
  }

  export interface CommentCtor {
    (value: string, raw: string): Comment;
  }

  export interface DoStatementCtor {
    (body: Statement[]): DoStatement;
  }

  export interface ElseClauseCtor {
    (body: Statement[]): ElseClause;
  }

  export interface ElseifClauseCtor {
    (condition: Expression, body: Statement[]): ElseifClause;
  }

  export interface ForGenericStatementCtor {
    (variables: Identifier[], iterators: Expression[], body: Statement[]): ForGenericStatement;
  }

  export interface ForNumericStatementCtor {
    (
      variable: Identifier,
      start: Expression,
      end: Expression,
      step: Expression,
      body: Statement[]
    ): ForNumericStatement;
  }

  export interface FunctionDeclarationCtor {
    (
      identifier: Identifier | MemberExpression | null,
      parameters: (Identifier | VarargLiteral)[],
      isLocal: boolean,
      body: Statement[]
    ): FunctionDeclaration;
  }

  export interface GotoStatementCtor {
    (label: Identifier): GotoStatement;
  }

  export interface IdentifierCtor {
    (name: string): Identifier;
  }

  export interface IfClauseCtor {
    (condition: Expression, body: Statement[]): IfClause;
  }

  export interface IfStatementCtor {
    (clauses: (IfClause | ElseifClause | ElseClause)[]): IfStatement;
  }

  export interface IndexExpressionCtor {
    (base: Expression, index: Expression): IndexExpression;
  }

  export interface LabelStatementCtor {
    (label: Identifier): LabelStatement;
  }

  export interface LiteralCtor {
    (type: LiteralType, value: boolean | null | number | string, raw: string): Literal;
  }

  export interface LocalStatementCtor {
    (variables: Identifier[], init: (Expression | null)[]): LocalStatement;
  }

  export interface MemberExpressionCtor {
    (base: Expression, indexer: string, identifier: Identifier): MemberExpression;
  }

  export interface RepeatStatementCtor {
    (condition: Expression, body: Statement[]): RepeatStatement;
  }

  export interface ReturnStatementCtor {
    (arguments: Expression[]): ReturnStatement;
  }

  export interface StringCallExpressionCtor {
    (base: Expression, argument: StringLiteral): StringCallExpression;
  }

  export interface TableCallExpressionCtor {
    (base: Expression, arguments: TableCallExpression): TableCallExpression;
  }

  export interface TableConstructorExpressionCtor {
    (fields: (TableKey | TableKeyString | TableValue)[]): TableConstructorExpression;
  }

  export interface TableKeyCtor {
    (key: Expression, value: Expression): TableKey;
  }

  export interface TableKeyStringCtor {
    (key: Identifier, value: Expression): TableKeyString;
  }

  export interface TableValueCtor {
    (value: Expression): TableValue;
  }

  export interface UnaryExpressionCtor {
    (operator: string, argument: Expression): UnaryExpression;
  }

  export interface WhileStatementCtor {
    (condition: Expression, body: Statement[]): WhileStatement;
  }

  export interface LabelStatement extends NodeAdditional {
    readonly type: "LabelStatement";
    readonly label: Identifier;
  }

  export interface BreakStatement extends NodeAdditional {
    readonly type: "BreakStatement";
  }

  export interface GotoStatement extends NodeAdditional {
    readonly type: "GotoStatement";
    readonly label: Identifier;
  }

  export interface ReturnStatement extends NodeAdditional {
    readonly type: "ReturnStatement";
    readonly arguments: Expression[];
  }

  export interface IfStatement extends NodeAdditional {
    readonly type: "IfStatement";
    readonly clauses: (IfClause | ElseifClause | ElseClause)[];
  }

  export interface IfClause extends NodeAdditional {
    readonly type: "IfClause";
    readonly condition: Expression;
    readonly body: Statement[];
  }

  export interface ElseifClause extends NodeAdditional {
    readonly type: "ElseifClause";
    readonly condition: Expression;
    readonly body: Statement[];
  }

  export interface ElseClause extends NodeAdditional {
    readonly type: "ElseClause";
    readonly body: Statement[];
  }

  export interface WhileStatement extends NodeAdditional {
    readonly type: "WhileStatement";
    readonly condition: Expression;
    readonly body: Statement[];
  }

  export interface DoStatement extends NodeAdditional {
    readonly type: "DoStatement";
    readonly body: Statement[];
  }

  export interface RepeatStatement extends NodeAdditional {
    readonly type: "RepeatStatement";
    readonly condition: Expression;
    readonly body: Statement[];
  }

  export interface LocalStatement extends NodeAdditional {
    readonly type: "LocalStatement";
    readonly variables: Identifier[];
    readonly init: (Expression | null)[];
  }

  export interface AssignmentStatement extends NodeAdditional {
    readonly type: "AssignmentStatement";
    readonly variables: (Identifier | IndexExpression | MemberExpression)[];
    readonly init: (Expression | null)[];
  }

  export interface CallStatement extends NodeAdditional {
    readonly type: "CallStatement";
    readonly expression: Expression;
  }

  export interface FunctionDeclaration extends NodeAdditional {
    readonly type: "FunctionDeclaration";
    readonly identifier: Identifier | MemberExpression | null;
    readonly isLocal: boolean;
    readonly parameters: (Identifier | VarargLiteral)[];
    readonly body: Statement[];
  }

  export interface ForNumericStatement extends NodeAdditional {
    readonly type: "ForNumericStatement";
    readonly variable: Identifier;
    readonly start: Expression;
    readonly end: Expression;
    readonly step: Expression;
    readonly body: Statement[];
  }

  export interface ForGenericStatement extends NodeAdditional {
    readonly type: "ForGenericStatement";
    readonly variables: Identifier[];
    readonly iterators: Expression[];
    readonly body: Statement[];
  }

  export interface Chunk extends NodeAdditional {
    readonly type: "Chunk";
    readonly body: Statement[];
    readonly comments: Comment[];
    readonly globals?: Expression[];
  }

  export interface Identifier extends NodeAdditional {
    readonly type: "Identifier";
    readonly name: string;
    readonly isLocal?: boolean;
  }

  export interface BooleanLiteral extends NodeAdditional {
    readonly type: "BooleanLiteral";
    readonly raw: string;
    readonly value: boolean;
  }

  export interface NilLiteral extends NodeAdditional {
    readonly type: "NilLiteral";
    readonly raw: string;
    readonly value: null;
  }

  export interface NumericLiteral extends NodeAdditional {
    readonly type: "NumericLiteral";
    readonly raw: string;
    readonly value: number;
  }

  export interface StringLiteral extends NodeAdditional {
    readonly type: "StringLiteral";
    readonly raw: string;
    readonly value: string;
  }

  export interface VarargLiteral extends NodeAdditional {
    readonly type: "VarargLiteral";
    readonly raw: string;
    readonly value: string;
  }

  export interface TableKey extends NodeAdditional {
    readonly type: "TableKey";
    readonly key: Expression;
    readonly value: Expression;
  }

  export interface TableKeyString extends NodeAdditional {
    readonly type: "TableKeyString";
    readonly key: Identifier;
    readonly value: Expression;
  }

  export interface TableValue extends NodeAdditional {
    readonly type: "TableValue";
    readonly value: Expression;
  }

  export interface TableConstructorExpression extends NodeAdditional {
    readonly type: "TableConstructorExpression";
    readonly fields: (TableKey | TableKeyString | TableValue)[];
  }

  export interface BinaryExpression extends NodeAdditional {
    readonly type: "BinaryExpression";
    readonly operator: string;
    readonly left: Expression;
    readonly right: Expression;
  }

  export interface LogicalExpression extends NodeAdditional {
    readonly type: "LogicalExpression";
    readonly operator: string;
    readonly left: Expression;
    readonly right: Expression;
  }

  export interface UnaryExpression extends NodeAdditional {
    readonly type: "UnaryExpression";
    readonly operator: string;
    readonly argument: Expression;
  }

  export interface MemberExpression extends NodeAdditional {
    readonly type: "MemberExpression";
    readonly indexer: string;
    readonly identifier: Identifier;
    readonly base: Expression;
  }

  export interface IndexExpression extends NodeAdditional {
    readonly type: "IndexExpression";
    readonly base: Expression;
    readonly index: Expression;
  }

  export interface CallExpression extends NodeAdditional {
    readonly type: "CallExpression";
    readonly base: Expression;
    readonly arguments: Expression[];
  }

  export interface TableCallExpression extends NodeAdditional {
    readonly type: "TableCallExpression";
    readonly base: Expression;
    readonly arguments: TableCallExpression;
  }

  export interface StringCallExpression extends NodeAdditional {
    readonly type: "StringCallExpression";
    readonly base: Expression;
    readonly argument: StringLiteral;
  }

  export interface Comment extends NodeAdditional {
    readonly type: "Comment";
    readonly raw: string;
    readonly value: string;
  }

  export interface Block {
    readonly body: Statement[];
  }

  export interface MarkerLocation {
    line: number;
    column: number;
  }

  export interface MarkerLocations {
    start: MarkerLocation;
    end: MarkerLocation;
  }

  export enum tokenTypes {
    EOF = 1,
    StringLiteral = 2,
    Keyword = 4,
    Identifier = 8,
    NumericLiteral = 16,
    Punctuator = 32,
    BooleanLiteral = 64,
    NilLiteral = 128,
    VarargLiteral = 256,
  }

  export type LiteralType =
    | tokenTypes.StringLiteral
    | tokenTypes.NumericLiteral
    | tokenTypes.BooleanLiteral
    | tokenTypes.VarargLiteral;

  export interface Token {
    readonly type: tokenTypes;
    readonly value: string;
    readonly line: number;
    readonly lineStart: number;
    readonly loc?: MarkerLocations;
    readonly range: [number, number];
  }

  export const defaultOptions: Options;
  export const version: string;
  export const ast: {
    assignmentStatement: AssignmentStatementCtor;
    binaryExpression: BinaryExpressionCtor;
    breakStatement: BreakStatementCtor;
    callExpression: CallExpressionCtor;
    callStatement: CallStatementCtor;
    chunk: ChunkCtor;
    comment: CommentCtor;
    doStatement: DoStatementCtor;
    elseClause: ElseClauseCtor;
    elseifClause: ElseifClauseCtor;
    forGenericStatement: ForGenericStatementCtor;
    forNumericStatement: ForNumericStatementCtor;
    functionStatement: FunctionDeclarationCtor;
    gotoStatement: GotoStatementCtor;
    identifier: IdentifierCtor;
    ifClause: IfClauseCtor;
    ifStatement: IfStatementCtor;
    indexExpression: IndexExpressionCtor;
    labelStatement: LabelStatementCtor;
    literal: LiteralCtor;
    localStatement: LocalStatementCtor;
    memberExpression: MemberExpressionCtor;
    repeatStatement: RepeatStatementCtor;
    returnStatement: ReturnStatementCtor;
    stringCallExpression: StringCallExpressionCtor;
    tableCallExpression: TableCallExpressionCtor;
    tableConstructorExpression: TableConstructorExpressionCtor;
    tableKey: TableKeyCtor;
    tableKeyString: TableKeyStringCtor;
    tableValue: TableValueCtor;
    unaryExpression: UnaryExpressionCtor;
    whileStatement: WhileStatementCtor;
  };

  export function end(code: string): Chunk;
  export function lex(): Token;
  export function parse(code: Options | string, options?: Options): Chunk;
  export function write(code: string): void;

  export type LuaVersion = "5.1" | "5.2" | "5.3" | "LuaJIT";
  export type EncodingMode = "pseudo-latin1" | "x-user-defined" | "none";

  export type CreateNodeCallback = (node: Node) => void;
  export type CreateScopeCallback = () => void;
  export type DestroyScopeCallback = () => void;
  export type LocalDeclarationCallback = (name: string) => void;

  export interface Options {
    wait?: boolean;
    comments?: boolean;
    scope?: boolean;
    locations?: boolean;
    ranges?: boolean;
    onCreateNode?: CreateNodeCallback;
    onCreateScope?: CreateScopeCallback;
    onDestroyScope?: DestroyScopeCallback;
    onLocalDeclaration?: LocalDeclarationCallback;
    luaVersion?: LuaVersion;
    encodingMode?: EncodingMode;
  }
}
