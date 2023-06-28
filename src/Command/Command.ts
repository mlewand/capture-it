import type NoteQuickAdd from "../NoteQuickAdd";

export type CommandConstructorOptions = {
	name?: string,
	app: NoteQuickAdd
};

export default class Command {
	name: string;

	app: NoteQuickAdd;

	constructor( options: CommandConstructorOptions ) {
		if ( !options.name ) {
			throw Error( 'Command name is required' );
		}

		this.name = options.name;
		this.app = options.app;
	}

	public async execute(): Promise<any> {
		throw new Error( `Command ${ this.name } is not implemented` );
	}
}
