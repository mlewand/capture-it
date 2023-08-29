import { WorkspaceInfo } from "@mlewand/capture-it-core";
import { unifyNotionPageId } from "./index";

// This module exports helpers related to capturing a note.

export async function appendPageToDatabase( pageText: string, workspace: WorkspaceInfo, tags: Set<string> ): Promise<void> {
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
		console.log('Page appended successfully:');
		console.log( data);
	} else {
		throw `Error (${ response.status }, ${ data.code }): ${ data.message }`;
	}

	data.redirect_url = data.url;

	return data;

	function tagsToNotionFormat( tags: Set<string> ) {
		return Array.from( tags ).map( tag => ( { name: tag } ) );
	}
}

export function appendParagraphToNotionPage( paragraphText: string, workspace: WorkspaceInfo ): Promise<void> {
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
			console.log( 'Paragraph appended successfully:');
			console.log( data );

			// Unfortunately this kind of operation doesn't return the page URL so we need to do it manually.
			data.redirect_url = 'https://www.notion.so/' + unifyNotionPageId( data.id );

			return data;
		} );
}