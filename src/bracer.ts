import { csharp } from "./languages/csharp";
import * as lang from "./language";

export type EditResult = { succeed: boolean, text: string }

const languages = new Map<string, lang.LanguageDescription>([ 
	[ "csharp", csharp ]
]);

class Expression { 
	data: lang.Operator | string;
	left: Expression | undefined;
	right: Expression | undefined;
	constructor(data: lang.Operator | string, left: Expression | undefined, right: Expression | undefined) {
		this.data = data;
		this.left = left;
		this.right = right;
	}
	brace_left(): boolean {
		if(typeof this.data === "string") { return false; }
		if(this.left === undefined) { return false; }
		if(typeof this.left.data === "string") { return false; }
		let pthis = this.data.priority;
		let pother = this.left.data.priority;
		if(pthis !== pother) { return pother < pthis; }
		return this.data.assoc === lang.Associativity.Right;
	}
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

type RawExpression = string | lang.Operator | Expression | RawExpression[];

function unbrace(expr: RawExpression[]): string | RawExpression[] {
	while(true) {
		let any = false;
		for(let i = 0; i < expr.length; ++i) {
			let current = expr[i];
			if(typeof current !== "string") { continue; }
			let open = current.indexOf('(');
			if(open < 0) { continue; }
			any = true;
			
			let new_expr: RawExpression[] = [];
			for(let j = 0; j < expr.length; ++j) {
				if(j !== i) {
					new_expr.push(expr[j]);
					continue;
				}
				if(open > 0) {
					new_expr.push(current.substring(0, open).trim());
				}
				let close = open + 1;
				let ident = 1;
				while((ident !== 0) && (close < current.length)) {
					if(current[close] === '(') { ident++; }
					if(current[close] === ')') { ident--; }
					close++;
				}
				if(ident !== 0) { return "Unmatched '('"; }
				let sub_expr: RawExpression[] = [ current.substring(open + 1, close - 1).trim() ];
				let unbraced = unbrace(sub_expr);
				if(typeof unbraced === "string") { return unbraced; }
				new_expr.push(unbraced);
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

function split(expr: RawExpression[], data: lang.LanguageDescription): string | RawExpression[] {
	let new_expr: RawExpression[] = [];
	for(let i = 0; i < expr.length; ++i) {
		let current = expr[i];
		if(typeof current !== "string") {
			let splitted = split(current as RawExpression[], data);
			if(typeof splitted === "string") { return splitted; }
			new_expr.push(splitted);
			continue;
		}
		let splitted: RawExpression[] = [ current ];
		data.by_length.forEach(e => {
			let new_split: RawExpression[] = [];
			splitted.forEach(s => {
				if(typeof s === "string") {
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
					new_split.push(s);
				}
			});
			splitted = new_split;
		});
		new_expr.push(...splitted);
	}
	return new_expr;
}

function parse(expr: RawExpression[], data: lang.LanguageDescription): string | Expression {
	if(expr.length === 0) { return "Empty exression"; }
	for(let i = 0; i < data.operators.length; ++i) {
		while(true) {
			if(expr.length === 1) {
				let single = expr[0];
				if(typeof single === "string") { 
					return new Expression(single, undefined, undefined);
				}
				if("left" in single) { return single; }
				if("priority" in single) { return "Operator without operands"; }
				return parse(single as RawExpression[], data);
			}

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
					let left = parse(expr.slice(0, index), data);
					if(typeof left === "string") { return left; }
					let right = parse(expr.slice(index + 1), data);
					if(typeof right === "string") { return right; }
					return new Expression(op, left, right);
				case lang.Usage.Prefix:
					if(index < expr.length - 1) {
						let right = parse([expr[index + 1]], data);
						if(typeof right === "string") { return right; }
						expr.splice(index, 2, new Expression(op, undefined, right));
					}
					break;
				case lang.Usage.Postfix:
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

function format(expr: Expression): string {
	if(typeof expr.data === "string") { return expr.data; }
	let ret = "";
	if(expr.left !== undefined) {
		let brace = expr.brace_left();
		if(brace) { ret += '('; }
		ret += format(expr.left);
		if(brace) { ret += ')'; }
	}
	if(expr.data.space) {
		if(expr.data.usage !== lang.Usage.Postfix) { ret += ' '; }
		ret += expr.data.value;
		if(expr.data.usage !== lang.Usage.Prefix) { ret += ' '; }
	} else {
		ret += expr.data.value;
	}
	if(expr.right !== undefined) {
		let brace = expr.brace_right();
		if(brace) { ret += '('; }
		ret += format(expr.right);
		if(brace) { ret += ')'; }
	}
	return ret;
}

function reduce(str: string, from: string, to: string): string {
	while(true) {
		let index = str.indexOf(from);
		if(index === -1) { return str; }
		str = str.substring(0, index) + to + str.substring(index + to.length);
	}
}

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
