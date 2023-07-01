import Command from './Command';
import type { CommandConstructorOptions } from './Command';
import { openUrl } from './OpenNotionPage';
import { shell } from 'electron';

export default class OpenBrowserCommand extends Command {
	constructor( options: CommandConstructorOptions ) {

		options.name = 'openBrowser';

		super( options );
	}

	public override async execute( url:string ): Promise<any> {
		return openUrl( {
			url,
			// Basic sanity check that it looks like a valid URL.
			allowedProtocols: [ 'https:', 'http:' ]
		} );
	}
}