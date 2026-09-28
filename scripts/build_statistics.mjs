import fs from 'node:fs';
import {computeStatistics} from '../lib/lexical-statistics.ts';
const index=JSON.parse(fs.readFileSync('public/data/index.json'));
for(const edition of ['BSB','ASV','SBLGNT']){
 const corpus=JSON.parse(fs.readFileSync(`public/data/${edition}.json`));
 const stats=computeStatistics(index,corpus);
 fs.writeFileSync(`public/data/statistics-${edition}.json`,JSON.stringify(stats)+'\n');
 console.log(edition,stats.pairs.map(p=>({pair:p.a+'-'+p.b,groups:p.rows.length,limited:p.rows.filter(r=>r.limited).length})));
}
