import {backup,DatabaseSync} from 'node:sqlite';
import fs from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve(process.env.DATA_DIR||'runtime');
const target=path.resolve(process.env.BACKUP_DIR||'backups',new Date().toISOString().replace(/[:.]/g,'-'));
await fs.mkdir(target,{recursive:true,mode:0o700});
const db=new DatabaseSync(path.join(source,'walking-rotarian.sqlite'),{readOnly:true});
try{await backup(db,path.join(target,'walking-rotarian.sqlite'));}finally{db.close();}
try{await fs.cp(path.join(source,'uploads'),path.join(target,'uploads'),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
console.log('Database and media backup completed. Store the backup privately, outside the served directory.');
