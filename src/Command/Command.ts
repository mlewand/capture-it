import type CaptureIt from "../CaptureIt";

export type CommandConstructorOptions = {
	name?: string,
	app: CaptureIt
};

export default class Command {
	name: string;

	app: CaptureIt;

	constructor( options: CommandConstructorOptions ) {
		if ( !options.name ) {
			throw Error( 'Command name is required' );
		}

		this.name = options.name;
		this.app = options.app;
	}

	public async execute( ...args: Array<any> ): Promise<any> {
		throw new Error( `Command ${ this.name } is not implemented` );
	}
}
