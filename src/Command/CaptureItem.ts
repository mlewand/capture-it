import Command from './Command';
import type { CommandConstructorOptions } from './Command';
import { unifyNotionPageId } from './AddNotionWorkspace';
import { WorkspaceInfo } from '../Config';

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

function appendParagraphToNotionPage( paragraphText: string, workspace: WorkspaceInfo ): Promise<void> {
	const url = `https://api.notion.com/v1/blocks/${ workspace.pageId }/children`;
	const requestOptions: RequestInit = {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${ workspace.notionToken }`,
			'Notion-Version': '2021-05-13'
		},
		body: JSON.stringify({
			children: [
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						text: [
							{
								type: 'text',
								text: {
									content: paragraphText
								}
							}
						]
					}
				}
			]
		})
	};

	return fetch(url, requestOptions)
		.then(async ( response ) => {
			const data = await response.json() as any;

			if ( !response.ok ) {
				throw `Error (${ response.status }, ${ data.code }): ${ data.message }`;
			}

			return data;
		} )
		.then( data => {
			console.log( 'Paragraph appended successfully:', data );

			// Unfortunately this kind of operation doesn't return the page URL so we need to do it manually.
			data.redirect_url = 'https://www.notion.so/' + unifyNotionPageId( data.id );

			return data;
		} );
}

async function appendPageToDatabase( pageText: string, workspace: WorkspaceInfo, tags: Set<string> ): Promise<void> {
	const responseBody = {
		parent: {
			database_id: workspace.dataBaseId
		},
		properties: {
			Name: {
				title: [
					{
						text: {
							content: pageText
						}
					}
				]
			}
		}
	};

	if ( workspace.default && workspace.default.tags ) {
		for (const defaultTag of workspace.default.tags) {
			tags.add( defaultTag );
		}
	}

	if ( tags.size > 0 ) {
		( responseBody.properties as any )[ workspace.tagFieldName || 'Tags' ] = {
			type: 'multi_select',
			multi_select: tagsToNotionFormat( tags )
		};
	}

	const response = await fetch( 'https://api.notion.com/v1/pages', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${ workspace.notionToken }`,
			'Content-Type': 'application/json',
			'Notion-Version': '2021-05-13'
		},
		body: JSON.stringify( responseBody )
	} );

	const data = await response.json();

	if (response.ok) {
		console.log('Page appended successfully:', data);
	} else {
		throw `Error (${ response.status }, ${ data.code }): ${ data.message }`;
	}

	data.redirect_url = data.url;

	return data;
}

function tagsToNotionFormat( tags: Set<string> ) {
	return Array.from( tags ).map( tag => ( { name: tag } ) );
}
