
import { addNote } from '@mlewand/capture-it-notes';
import { WorkspaceInfo } from '@mlewand/capture-it-core';
import * as CaptureItNotion from '@mlewand/capture-it-notion';

const config = require( '/Users/mlewand/.remove-me-config.json' ).items as WorkspaceInfo[];

async function main() {
	console.log( 'test - working fine' );
	addNote( 'stefanio' );
	console.log( config );

	console.log('adding');
	CaptureItNotion.appendPageToDatabase( 'hello world from cli module', config[ 0 ], new Set<string>() )
		.then( () => console.log( 'done' ) )
		.catch( err => console.error( 'error', err ) );
}

main();