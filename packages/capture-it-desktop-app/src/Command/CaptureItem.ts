import Command from './Command';
import type { CommandConstructorOptions } from './Command';

import { appendPageToDatabase, appendParagraphToNotionPage } from '@mlewand/capture-it-notion';
import { escapeRegExp } from 'lodash';

export default class CaptureItemCommand extends Command {
	constructor( options: CommandConstructorOptions ) {

		options.name = 'captureItem';

		super( options );
	}

	public async execute( noteText: string ): Promise<any> {
		const activeWorkspace = this.app.activeWorkspace;

		if ( !activeWorkspace ) {
			throw new Error( 'Configuration not loaded or no active workspace is set' );
		}

		const { pageId, notionToken } = activeWorkspace;

		if ( noteText.trim() === '' ) {
			throw new Error( "Can't send an empty item." );
		}

		// Check for known tags.
		const tagsMapping = Object.assign( {}, this.app.config!.tags || {}, activeWorkspace.tags || {} );
		const { sanitizedText, tags } = extractTags( noteText, tagsMapping );
		console.log('found tags: ', Array.from( tags ) );

		const insertPromise = activeWorkspace.dataBaseId ?
			appendPageToDatabase( sanitizedText, activeWorkspace, tags )
			: appendParagraphToNotionPage( sanitizedText, activeWorkspace );


		const ret = ( await insertPromise ) as any;

		ret.sanitizedText = sanitizedText;
		ret.originalText = noteText;

		console.log('returning', ret);

		return ret;
	}
}

function extractTags( noteText: string, tagsMapping?: { [ key: string ]: string | string[] } ): { sanitizedText: string, tags: Set<string> } {
	if ( !tagsMapping ) {
		return { sanitizedText: noteText, tags: new Set() };
	}
	const tags: Set<string> = new Set();
	let sanitizedText = noteText;

	for ( const [ key, mappingValue ] of Object.entries( tagsMapping ) ) {
		const matchInfo = sanitizedText.match( new RegExp( `(\\s+${escapeRegExp( key )})([\\s]|$)`, 'i' ) )
		if ( matchInfo ) {
			sanitizedText = sanitizedText.replace( matchInfo[ 1 ], '' );

			for (const tagString of Array.isArray( mappingValue ) ? mappingValue : [ mappingValue ]) {
				tags.add( tagString );
			}
		}
	}

	return { sanitizedText, tags };
}
