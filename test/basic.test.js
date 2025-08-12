import test from 'ava';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, '..', 'package.json');

test('package.json should have required fields', t => {
	const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
	
	t.truthy(packageJson.name);
	t.truthy(packageJson.version);
	t.truthy(packageJson.license);
	t.truthy(packageJson.bin);
	t.truthy(packageJson.repository);
});

test('dist directory should be built', t => {
	try {
		readFileSync(join(__dirname, '..', 'dist', 'core', 'cli.js'), 'utf8');
		t.pass('dist directory exists with cli.js');
	} catch (error) {
		t.fail(`dist/core/cli.js not found: ${error.message}`);
	}
});
