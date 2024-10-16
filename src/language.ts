/**
 * Represents where the operators' operands are placed.
 */
export enum Usage {
	Prefix,
	Postfix,
	Binary
}

/**
 * Represents in which direction operator is evaluated.
 */
export enum Associativity {
	Left,
	Right
}

/**
 * Represents an operator.
 */
export class Operator { 
	/**
	 * How this operator is written
	 */
	readonly value!: string;
	/**
	 * Priority value. Operators with higher priority are executed earlier.
	 */
	readonly priority!: number;
	/**
	 * Operator 
	 */
	readonly usage!: Usage;
	/**
	 * Order of execution (left->right or right->left)
	 */
	readonly assoc!: Associativity;
	/**
	 * Whether this operator should be spaced from outside.
	 */
  readonly space!: boolean;
}

export function operator(value: string, priority: number, usage: Usage, assoc: Associativity, space: boolean): Operator {
	return { value: value, priority: priority, usage: usage, assoc: assoc, space: space };
}

/**
 * Describes a language's operators.
 */
export class LanguageDescription {
	/**
	 * List of operators sorted by priority, from low to high
	 */
	readonly operators: Operator[];
	/**
	 * List of operators sorted by textual length, from high to low
	 */
	readonly by_length: Operator[];

	constructor(operators: Operator[]) {
		this.operators = [];
		this.operators.push(...operators);
		this.operators.sort((a, b) => a.priority - b.priority);
		this.by_length = [];
		this.by_length.push(...operators);
		this.by_length.sort((a, b) => b.value.length - a.value.length);
	}
}
