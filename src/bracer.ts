import { csharp } from "./languages/csharp";
import * as lang from "./language";

/**
 * Result of expression processing.
 * @see {@link edit}
 */
export type EditResult = { 
	/**
	 * Whether the processing succeed.
	 */
	succeed: boolean, 
	/**
	 * Processed expression, if processing succeed. Otherwise, error description.
	 * @see {@link EditResult.succeed}
	 */
	text: string
}

const languages = new Map<string, lang.LanguageDescription>([ 
	[ "csharp", csharp ]
]);

/**
 * Literal value, identifier reference or an operator usage.
 */
class Expression { 
	/**
	 * If this is a {@link string}, then this expression represents identifier or a literal.  
	 * If this is a {@link lang.Operator}, then this is a operator usage.
	 */
	data: lang.Operator | string;
	/**
	 * Left side of an operator. {@link undefined} for postfix operators.
	 * @see {@link data}, {@link lang.Usage}
	 */
	left: Expression | undefined;
	/**
	 * Left side of an operator. {@link undefined} for prefix operators.
	 * @see {@link data}, {@link lang.Usage}
	 */
	right: Expression | undefined;

	constructor(data: lang.Operator | string, left: Expression | undefined, right: Expression | undefined) {
		this.data = data;
		this.left = left;
		this.right = right;
	}

	/**
	 * Checks if left-side expression should be braced.
	 */
	brace_left(): boolean {
		if(typeof this.data === "string") { return false; }
		if(this.left === undefined) { return false; }
		if(typeof this.left.data === "string") { return false; }
		let pthis = this.data.priority;
		let pother = this.left.data.priority;
		if(pthis !== pother) { return pother < pthis; }
		return this.data.assoc === lang.Associativity.Right;
	}

	/**
	 * Checks if right-side expression should be braced.
	 */
	brace_right(): boolean {
		if(typeof this.data === "string") { return false; }
		if(this.right === undefined) { return false; }
		if(typeof this.right.data === "string") { return false; }
		let pthis = this.data.priority;
		let pother = this.right.data.priority;
		if(pthis !== pother) { return pother < pthis; }
		return this.data.assoc === lang.Associativity.Left;
	}
};

/**
 * Unparsed expresssion. Array of this type is a stream 
 * of tokens, possibly with some brace indentation.
 */
type RawExpression = string | lang.Operator | Expression | RawExpression[];

/**
 * Removes braces from the expression.
 * @param expr Expression to process.
 * @returns Given expression with braces turned into nested expressions. 
 * On failure, returns {@link string} with error description.
 * @see {@link edit}
 */
function unbrace(expr: RawExpression[]): string | RawExpression[] {
	while(true) {
		let any = false;
		for(let i = 0; i < expr.length; ++i) {
			// look for a string with braces
			let current = expr[i];
			if(typeof current !== "string") { continue; }
			let open = current.indexOf('(');
			if(open < 0) { continue; }
			any = true;
			
			// found it, build new expression with that brace turned into a nested expression
			let new_expr: RawExpression[] = [];
			for(let j = 0; j < expr.length; ++j) {
				// only change that string with braces
				if(j !== i) {
					new_expr.push(expr[j]);
					continue;
				}
				// everything before brace
				if(open > 0) {
					new_expr.push(current.substring(0, open).trim());
				}
				// find matching closing brace
				let close = open + 1;
				let ident = 1;
				while((ident !== 0) && (close < current.length)) {
					if(current[close] === '(') { ident++; }
					if(current[close] === ')') { ident--; }
					close++;
				}
				if(ident !== 0) { return "Unmatched '('"; }
				// unbrace recursively and add
				let sub_expr: RawExpression[] = [ current.substring(open + 1, close - 1).trim() ];
				let unbraced = unbrace(sub_expr);
				if(typeof unbraced === "string") { return unbraced; }
				new_expr.push(unbraced);
				// everything after brace
				if(close + 1 < current.length) {
					new_expr.push(current.substring(close).trim());
				}
			}
			expr = new_expr;
		}
		if(!any) { break; }
	}
	return expr;
}

/**
 * Splits all operators from this expression and all nested expressions.
 * @param expr Expression to process.
 * @param data Description of a language {@link expr} is written in.
 * @returns Given expression with operators extracted from raw strings.
 * On failure, returns {@link string} with error description.
 * @see {@link edit}, {@link lang.Operator}
 */
function split(expr: RawExpression[], data: lang.LanguageDescription): string | RawExpression[] {
	let new_expr: RawExpression[] = [];
	for(let i = 0; i < expr.length; ++i) {
		let current = expr[i];
		// not a string but a nested expression
		if(typeof current !== "string") {
			let splitted = split(current as RawExpression[], data);
			if(typeof splitted === "string") { return splitted; }
			new_expr.push(splitted);
			continue;
		}
		// string, split by operators and add actual operator 
		// objects instead of string representations
		let splitted: RawExpression[] = [ current ];
		data.by_length.forEach(e => {
			let new_split: RawExpression[] = [];
			splitted.forEach(s => {
				if(typeof s === "string") {
					// "a*b" {+} "c*d" -> "a" {*} "b" {+} "c" {*} "d" 
					while(true) {
						let index = s.indexOf(e.value);
						if(index === -1) {
							s = s.trim();
							if(s.length > 0) { new_split.push(s); }
							break;
						}
						if(index > 0) {
							new_split.push(s.substring(0, index).trim());
						}
						new_split.push(e);
						s = s.substring(index + e.value.length).trim();
					}
				} else {
					// previously processed operator, keep as is
					new_split.push(s);
				}
			});
			splitted = new_split;
		});
		new_expr.push(...splitted);
	}
	return new_expr;
}

/**
 * Parses given expression into a expression tree.
 * @param expr Expression to process.
 * @param data Description of a language {@link expr} is written in.
 * @returns Evaluation tree for a given expression.
 * On failure, returns {@link string} with error description.
 * @see {@link edit}, {@link Expression}
 */
function parse(expr: RawExpression[], data: lang.LanguageDescription): string | Expression {
	if(expr.length === 0) { return "Empty exression"; }
	// pick the first operator with the lowest priority and return it as an value
	for(let i = 0; i < data.operators.length; ++i) {
		while(true) {
			// no operations left
			if(expr.length === 1) {
				let single = expr[0];
				if(typeof single === "string") { 
					return new Expression(single, undefined, undefined);
				}
				if("left" in single) { return single; }
				if("priority" in single) { return "Operator without operands"; }
				return parse(single as RawExpression[], data);
			}

			// find the last operator to execute
			let op = data.operators[i];
			let index: number;
			switch (op.assoc) {
				case lang.Associativity.Left:
					index = expr.lastIndexOf(op);
					break;
				case lang.Associativity.Right:
					index = expr.indexOf(op);
					break;
			}

			if(index === -1) { break; }
			switch (op.usage) {
				case lang.Usage.Binary:
					// binary - return the expression
					let left = parse(expr.slice(0, index), data);
					if(typeof left === "string") { return left; }
					let right = parse(expr.slice(index + 1), data);
					if(typeof right === "string") { return right; }
					return new Expression(op, left, right);
				case lang.Usage.Prefix:
					// 'operator' + 'value' -> 'expression'
					if(index < expr.length - 1) {
						let right = parse([expr[index + 1]], data);
						if(typeof right === "string") { return right; }
						expr.splice(index, 2, new Expression(op, undefined, right));
					}
					break;
				case lang.Usage.Postfix:
					// 'value' + 'operator' -> 'expression'
					if(index > 0) {
						let left = parse([expr[index - 1]], data);
						if(typeof left === "string") { return left; }
						expr.splice(index - 1, 2, new Expression(op, undefined, left));
					}
					break;
			}
		}
	}
	return "Could not build expression tree";
}

/**
 * Formats given expression into. 
 * @param expr Expression to format.
 * @returns String representation of a given expression.
 */
function format(expr: Expression): string {
	// keep literals/identifiers as is
	if(typeof expr.data === "string") { return expr.data; }
	let ret = "";
	// left side
	if(expr.left !== undefined) {
		let brace = expr.brace_left();
		if(brace) { ret += '('; }
		ret += format(expr.left);
		if(brace) { ret += ')'; }
	}
	// operator
	if(expr.data.space) {
		if(expr.data.usage !== lang.Usage.Postfix) { ret += ' '; }
		ret += expr.data.value;
		if(expr.data.usage !== lang.Usage.Prefix) { ret += ' '; }
	} else {
		ret += expr.data.value;
	}
	// right side
	if(expr.right !== undefined) {
		let brace = expr.brace_right();
		if(brace) { ret += '('; }
		ret += format(expr.right);
		if(brace) { ret += ')'; }
	}
	return ret;
}

/**
 * Continuously changes {@link from} to {@link to} in {@link str}, until there
 * is no substring of {@link from} in {@link str}.
 * @param str Source string.
 * @param from String to remove.
 * @param to String to replace {@link from} with.
 * @returns Processed string.
 */
function reduce(str: string, from: string, to: string): string {
	while(true) {
		let index = str.indexOf(from);
		if(index === -1) { return str; }
		str = str.substring(0, index) + to + str.substring(index + to.length);
	}
}

/**
 * Removes all unnecessary braces from the given expression.
 * @param language VSCode language id {@link expression} is written in.
 * @param expression Raw expression to process.
 * @returns Processed string or error description.
 * @see {@link unbrace}, {@link split}, {@link parse}, {@link format}
 */
export function edit(language: string, expression: string): EditResult {
	let data = languages.get(language);
	if(data === undefined) {
		return { succeed: false, text: `Language "${language}" is not supported yet` };
	}
	
	let expr: RawExpression[] = [ expression.trim() ];
	let unbraced = unbrace(expr);
	if(typeof unbraced === "string") {
		return { succeed: false, text: unbraced };
	}
	let splitted = split(unbraced, data);
	if(typeof splitted === "string") {
		return { succeed: false, text: splitted };
	}
	let parsed = parse(splitted, data);
	if(typeof parsed === "string") {
		return { succeed: false, text: parsed };
	}

	let formatted = format(parsed).trim();
	formatted = reduce(formatted, "  ", " ");
	formatted = reduce(formatted, " )", ")");
	formatted = reduce(formatted, "( ", "(");
	return { succeed: true, text: formatted };
}
