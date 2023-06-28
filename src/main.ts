
import * as path from 'path';
import NoteQuickAdd from './NoteQuickAdd';

const ROOT_DIRECTORY = path.join( __dirname, '..', '..' );
const app = new NoteQuickAdd( ROOT_DIRECTORY );
app.start();
