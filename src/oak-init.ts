import { getStat } from './utils'
import { openSync, closeSync } from 'fs';
import { join } from 'path';

export async function oak_init(): Promise<void> {
    const possiblePreexistingOakfiles = await Promise.all([
        getStat(join(process.cwd(), 'Oakfile')),
        getStat(join(process.cwd(), 'Oakfile.js')),
    ]);
    if (possiblePreexistingOakfiles.filter(stat => stat).length > 0) {
        console.warn(`Did NOT create an Oakfile, one already seems to exist. (Oakfile or Oakfile.js)`)
        return;
    }
    const newOakfilePath = join(process.cwd(), 'Oakfile');
    closeSync(openSync(newOakfilePath, 'w'));
    console.log(`Created an empty Oakfile`)
    return;
}