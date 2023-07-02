import Command from './Command';
import type { CommandConstructorOptions } from './Command';
import type { SetActiveWorkspaceParameter } from '../NoteQuickAdd';

export default class SetWorkspaceCommand extends Command {
	constructor( options: CommandConstructorOptions ) {

		options.name = 'setWorkspace';

		super( options );
	}

	public async execute( workspaceIndex: SetActiveWorkspaceParameter ): Promise<any> {
		this.app.setActiveWorkspace( workspaceIndex );
	}
}
