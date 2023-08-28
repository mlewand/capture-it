
import path from 'path';
import { promises as fs } from 'fs';

// Path to the project root directory.
const ROOT_DIR = path.resolve( [ path.dirname( path.resolve( __filename ) ), '..', '..', '..', '..' ].join( path.sep ) );

export async function main() {
	console.log( 'test - working fine' );

	console.log( ROOT_DIR );

	const packageName = process.argv[ 2 ] as string;
	const fullPath = getFullPackagePath( packageName );

	console.log( packageName );

	await validatePackageName( packageName, fullPath );

	await fs.mkdir( fullPath );

	await Promise.all( [
		createPackageJson( packageName, fullPath ),
		createTsconfigJson( packageName, fullPath ),
		createReadMe( packageName, fullPath ),
		createSourceCode( packageName, fullPath )
	] );

	console.log( 'youre gooood to go!! 🎉' );
}

async function validatePackageName( name: string | undefined, fullPath: string ) {
	if ( !name ) {
		throw new Error( 'Package name can not be empty.' );
	}

	try {
		await fs.stat( fullPath );

		throw new Error( `Package "${name}" already exists in a "${fullPath}" directory.` );
	} catch ( error: any ) {
		if ( error.code !== 'ENOENT' ) {
			throw error;
		}
	}

}

function createPackageJson( packageName : string, packageFullPath : string ) {
	return fs.writeFile( path.join( packageFullPath, 'package.json' ), JSON.stringify( {
		name: '@mlewand/capture-it-' + packageName,
		version: '0.0.2',
		main: 'dist/src/index.js',
		license: 'UNLICENSED',
		scripts: {
		  build: 'tsc --build'
		},
		devDependencies: {
		  typescript: '^5.1.6'
		}
	}, null, 2 ) );
}

function createTsconfigJson( packageName : string, packageFullPath : string ) {
	return fs.writeFile( path.join( packageFullPath, 'tsconfig.json' ), `{
	"extends": "../tsconfig-package.json",
	"compilerOptions": {
		"outDir": "./dist", // Needed due to https://github.com/microsoft/TypeScript/issues/29172.
	}
}` );
}

async function createSourceCode( packageName: string, packageFullPath: string ) {
	await fs.mkdir( path.join( packageFullPath, 'src' ) );

	return fs.writeFile( path.join( packageFullPath, 'src', 'index.ts' ), `export function main() {
	console.log( 'hello world, this is ${ packageName } package.' );
} ` );
}

function createReadMe( packageName : string, packageFullPath : string ) {
	return fs.writeFile( path.join( packageFullPath, 'README.md' ), `# capture-it-${ packageName }\n\n` );
}

function getFullPackagePath( packageName: string = '') {
	return path.join( ROOT_DIR, 'packages', 'capture-it-' + packageName );
}

main();