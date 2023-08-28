
// An example function.

export interface Addable {
	add(b: number): void;
}

export function add(a: number, b: number): number {
	return a + b;
}