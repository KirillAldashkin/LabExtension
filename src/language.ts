export enum Usage {
	Prefix,
	Postfix,
	Binary
}

export enum Associativity {
	Left,
	Right
}

export class Operator { 
	readonly value!: string;
	readonly priority!: number;
	readonly usage!: Usage;
	readonly assoc!: Associativity;
  readonly space!: boolean;
}

export function operator(value: string, priority: number, usage: Usage, assoc: Associativity, space: boolean): Operator {
	return { value: value, priority: priority, usage: usage, assoc: assoc, space: space };
}

export class LanguageDescription {
	readonly operators: Operator[];
	readonly by_length: Operator[];
	readonly max_priority: number;
	readonly min_priority: number;

	constructor(operators: Operator[]) {
		this.operators = operators;
		this.max_priority = Math.max(...operators.map(x => x.priority));
		this.min_priority = Math.min(...operators.map(x => x.priority));
		this.by_length = [];
		this.by_length.push(...operators);
		this.by_length.sort((a, b) => b.value.length - a.value.length);
	}

	of_priotity(priority: number): Operator[] {
		return this.operators.filter(x => x.priority === priority);
	}
}
