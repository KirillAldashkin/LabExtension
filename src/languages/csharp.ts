import * as lang from "../language";

/**
 * Definition of the C# language syntax.
 * @see {@link lang.LanguageDescription}
 * @see https://learn.microsoft.com/dotnet/csharp/language-reference/operators, 
 * 'Operator precedence' and 'Operator associativity'
 */
export const csharp = new lang.LanguageDescription([
// skipped compound operators like lambda definition, stackalloc, ternary, etc.
  lang.operator("=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("+=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("-=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("*=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("/=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("%=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("&=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("|=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("^=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("<<=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator(">>=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator(">>>=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("??=", 0, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("??", 1, lang.Usage.Binary, lang.Associativity.Right, true),
  lang.operator("||", 2, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("&&", 3, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("|", 4, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("^", 5, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("&", 6, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("==", 7, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("!=", 7, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("<", 8, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator(">", 8, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("<=", 8, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator(">=", 8, lang.Usage.Binary, lang.Associativity.Left, true),
// not sure how to distinct 'assert' from 'as'+'sert'
// lang.operator("is", 8, lang.Usage.Binary, lang.Associativity.Left, true),
// lang.operator("as", 8, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("<<", 9, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator(">>", 9, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator(">>>", 9, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("+", 10, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("-", 10, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("*", 11, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("/", 11, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("%", 11, lang.Usage.Binary, lang.Associativity.Left, true),
  lang.operator("..", 12, lang.Usage.Binary, lang.Associativity.Left, false),
// not sure how to handle operator being either binary or unary
// lang.operator("+", 13, lang.Usage.Prefix, lang.Associativity.Left, false),
// lang.operator("-", 13, lang.Usage.Prefix, lang.Associativity.Left, false),
  lang.operator("!", 13, lang.Usage.Prefix, lang.Associativity.Left, false),
  lang.operator("~", 13, lang.Usage.Prefix, lang.Associativity.Left, false),
  lang.operator("++", 13, lang.Usage.Prefix, lang.Associativity.Left, false),
  lang.operator("--", 13, lang.Usage.Prefix, lang.Associativity.Left, false),
  lang.operator("^", 13, lang.Usage.Prefix, lang.Associativity.Left, false),
  lang.operator("&", 13, lang.Usage.Prefix, lang.Associativity.Left, false),
  lang.operator("*", 13, lang.Usage.Prefix, lang.Associativity.Left, false),
  lang.operator("++", 14, lang.Usage.Postfix, lang.Associativity.Left, false),
  lang.operator("--", 14, lang.Usage.Postfix, lang.Associativity.Left, false),
  lang.operator("->", 14, lang.Usage.Binary, lang.Associativity.Left, false),
]);