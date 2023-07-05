import Command from './Command';
import type { CommandConstructorOptions } from './Command';

export default class CaptureItemCommand extends Command {
	constructor( options: CommandConstructorOptions ) {

		options.name = 'captureItem';

		super( options );
	}

	public async execute( noteText: string ): Promise<any> {
		// const activeWorkspace = getActiveWorkspace();
		const activeWorkspace = this.app.activeWorkspace;

		if ( !activeWorkspace ) {
			throw new Error( 'Configuration not loaded or no active workspace is set' );
		}

		const { pageId, dataBaseId, notionToken } = activeWorkspace;

		if ( noteText.trim() === '' ) {
			throw new Error( "Can't send an empty item." );
		}

		const insertPromise = dataBaseId ? appendPageToDatabase(dataBaseId, notionToken, noteText)
			: appendParagraphToNotionPage(pageId!, notionToken, noteText);


		return await insertPromise;
	}
}

function appendParagraphToNotionPage(pageId: string, notionToken: string, paragraphText: string): Promise<void> {
	const url = `https://api.notion.com/v1/blocks/${pageId}/children`;
	const requestOptions: RequestInit = {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${notionToken}`,
			'Notion-Version': '2021-05-13' // Replace with the desired Notion API version
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
			data.url = 'https://www.notion.so/' + pageId;

			return data;
		} );
}

async function appendPageToDatabase(databaseId: string, apiToken: string, pageText: string): Promise<void> {
	const response = await fetch('https://api.notion.com/v1/pages', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiToken}`,
			'Content-Type': 'application/json',
			'Notion-Version': '2021-05-13'
		},
		body: JSON.stringify({
			parent: {
				database_id: databaseId
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
		})
	});

	const data = await response.json();

	if (response.ok) {
		console.log('Page appended successfully:', data);
	} else {
		throw `Error (${ response.status }, ${ data.code }): ${ data.message }`;
	}

	return data;
}