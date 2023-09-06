import Command from './Command';
import type { CommandConstructorOptions } from './Command';
import { promises as fs } from 'fs';
import Config from '../Config';
import * as path from 'path';
import open from 'open';

export default class OpenConfigCommand extends Command {
	constructor( options: CommandConstructorOptions ) {

		options.name = 'openConfig';

		super( options );
	}

	public async execute(): Promise<any> {
		const expectedConfigPath = Config.getUserConfigPath();

		try {
			const stat = await fs.stat( expectedConfigPath );

			if ( !stat.isFile() ) {
				throw new Error( 'Config is not a file' );
			}
		} catch ( error ) {
			await fs.copyFile( path.join( this.app.rootPath, '.capture-it-config.tpl.jsonc' ), expectedConfigPath );
		}

		return open( expectedConfigPath, { wait: true } );
	}
}