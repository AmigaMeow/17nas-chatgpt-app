import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
const file=process.argv[2];
if(!file)throw new Error('Usage: npm run export:validate -- snapshot.json');
const bundle=await build({entryPoints:['src/stats.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {validateSnapshot}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const snapshot=validateSnapshot(JSON.parse(await readFile(file,'utf8')));
console.log(JSON.stringify({valid:true,generatedAt:snapshot.generatedAt,countries:Object.keys(snapshot.own.countries).length,apnicCountries:snapshot.apnic.countries.length}));
