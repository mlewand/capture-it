import Command from './Command';
import type { CommandConstructorOptions } from './Command';

export default class CaptureItemCommand extends Command {
	constructor( options: CommandConstructorOptions ) {

		options.name = 'captureItem';

		super( options );
	}

	public async execute( noteText: string ): Promise<any> {
		console.log( 'captureItem command executed' );
		return new Promise( ( resolve, reject ) => {
			setTimeout( () => {
				resolve( { message: 'Hello from CaptureItemCommand', text: noteText } );
			}, 500 );
		} );
	}
}