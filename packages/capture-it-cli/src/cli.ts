
// import { addNote } from 'capture-it-notes';
import { NotesModule } from 'capture-it-notes';

const addNote = NotesModule.addNote;

function main() {
	console.log('test - working fine');
	addNote( 'stefanio' );
}


main();