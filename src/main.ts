
import { join } from 'path';
import NoteQuickAdd from './NoteQuickAdd';

const ROOT_DIRECTORY = join( __dirname, '..', '..' );
const app = new NoteQuickAdd( ROOT_DIRECTORY );
app.start();
