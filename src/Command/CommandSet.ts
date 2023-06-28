import type Command from './Command';

export default class CommandSet extends Set<Command> {
	public find( name: string ) : Command | null {
		for (const command of this ) {
			if ( command.name === name ) {
				return command;
			}
		}

		return null;
	}

	public async execute( name: string ) : Promise<any> {
		const cmd = this.find( name );

		if ( cmd ) {
			return cmd.execute();
		} else {
			throw new Error( `Command ${ name } was not found` );
		}
	}
}
