import Command from './Command';
import type { CommandConstructorOptions } from './Command';

export default class QuitCommand extends Command {
	constructor( options: CommandConstructorOptions ) {

		options.name = 'quit';

		super( options );
	}

	public async execute(): Promise<any> {
		this.app.quit();
	}
}