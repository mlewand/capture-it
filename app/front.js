const { ipcRenderer } = require('electron');

let config = undefined;

async function asyncInitialization() {
	try {
		config = await ipcRenderer.invoke( 'getConfig' );
		config = JSON.parse( config );
		console.log( 'config fetched', config );
	} catch ( error ) {
		console.error( error );
		alert( error );
	}
}

asyncInitialization();

document.getElementById( 'submitButton' ).addEventListener( 'click', () => {
	const textInput = document.getElementById( 'textInput' );
	const text = textInput.value;
	textInput.value = '';

	const { pageId, notionToken } = config;

	appendParagraphToNotionPage(pageId, notionToken, text);
} );


function appendParagraphToNotionPage(pageId, notionToken, paragraphText) {
	const url = `https://api.notion.com/v1/blocks/${pageId}/children`;
	const requestOptions = {
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
	  .then(response => response.json())
	  .then(data => {
		console.log('Paragraph appended successfully:', data);
	  })
	  .catch(error => {
		console.error('Error appending paragraph:', error);
	  });
  }
