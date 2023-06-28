import type NoteQuickAdd from "./NoteQuickAdd";

type CommandConstructorOptions = {
	name: string,
	app: NoteQuickAdd
};

export default class Command {
	name: string;

	app: NoteQuickAdd;

	constructor( options: CommandConstructorOptions ) {
		this.name = options.name;
		this.app = options.app;
	}

	public async execute(): Promise<any> {
		throw new Error( `Command ${ this.name } is not implemented` );
	}
}
