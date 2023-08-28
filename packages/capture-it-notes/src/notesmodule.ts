
export interface Noter {
	addNote: ( noteName: string ) => void;

	name: string;
}

export function addNote( noteName: string ): void {
	console.log( 'addNote', noteName );
}

export function dumpNoter( noter: Noter ): void {
	console.log( 'dumpNoter', noter.name );
}