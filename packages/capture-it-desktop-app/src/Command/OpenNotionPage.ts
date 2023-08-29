import Command from './Command';
import type { CommandConstructorOptions } from './Command';
import { shell } from 'electron';

export default class OpenNotionPageCommand extends Command {
	constructor( options: CommandConstructorOptions ) {

		options.name = 'openNotionPage';

		super( options );
	}

	public override async execute( url:string ): Promise<any> {
		return openUrl( {
			url,
			// Basic sanity check that it looks like a Notion page URL.
			allowedProtocols: [ 'https:' ],
			// If the user has configured to force open links in the Notion app, then we need to change the protocol.
			forcedProtocol: this.app.config!.forceOpenLinksInNotionApp ? 'notion:' : undefined
		} );
	}
}

type OpenUrlOptions = {
	url: string,
	allowedProtocols?: string[],
	// Note the protocol must contain a colon, e.g. 'https:', 'notion:', 'mailto:' etc.
	forcedProtocol?: string
};

export async function openUrl( options: OpenUrlOptions ) : Promise<any> {
	const parsedUrl = new URL( options.url );

	if ( options.allowedProtocols && !options.allowedProtocols.includes( parsedUrl.protocol ) ) {
		return false;
	}

	// Construct opened URL from URL instance as it will be encoded correctly if someone passed extra space.
	let targetUrl = String( parsedUrl );

	if ( options.forcedProtocol ) {
		targetUrl = targetUrl.replace( parsedUrl.protocol, options.forcedProtocol );
	}

	return shell.openExternal( targetUrl, { logUsage: true } );
}
