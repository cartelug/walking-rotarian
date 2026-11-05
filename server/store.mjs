import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import {randomBytes,createHmac} from 'node:crypto';
import { CONTENT_KINDS } from '../src/assets/platform/model.js';

export function openStore(directory, seed={}) {
  if (directory!==':memory:') mkdirSync(directory,{recursive:true,mode:0o700});
  const db=new DatabaseSync(directory===':memory:'?':memory:':path.join(directory,'walking-rotarian.sqlite'));
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS content(kind TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,author_id TEXT,PRIMARY KEY(kind,id));
    CREATE TABLE IF NOT EXISTS revisions(id INTEGER PRIMARY KEY,kind TEXT NOT NULL,content_id TEXT NOT NULL,payload TEXT NOT NULL,version INTEGER NOT NULL,actor TEXT,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,password_hash TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),csrf TEXT NOT NULL,expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS submissions(id TEXT PRIMARY KEY,kind TEXT NOT NULL,payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',owner TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS subscribers(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,journey TEXT NOT NULL,frequency TEXT NOT NULL,status TEXT NOT NULL,confirm_hash TEXT,confirm_expires INTEGER,manage_hash TEXT NOT NULL,created_at TEXT NOT NULL,last_sent TEXT);
    CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,type TEXT NOT NULL,payload TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL,last_error TEXT NOT NULL DEFAULT '',result TEXT,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS analytics(day TEXT NOT NULL,event TEXT NOT NULL,resource TEXT NOT NULL,source TEXT NOT NULL,count INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(day,event,resource,source));
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,resource TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS jobs_due ON jobs(state,next_at);
  `);
  const now=()=>new Date().toISOString();
  let subscriptionSecret=db.prepare("SELECT value FROM meta WHERE key='subscription_secret'").get()?.value;
  if(!subscriptionSecret){subscriptionSecret=randomBytes(32).toString('hex');db.prepare('INSERT INTO meta(key,value) VALUES(?,?)').run('subscription_secret',subscriptionSecret);}
  const store={db,
    manageToken(id){return createHmac('sha256',subscriptionSecret).update(id).digest('base64url');},
    list(kind){return db.prepare('SELECT * FROM content WHERE kind=? ORDER BY updated_at DESC').all(kind).map(row=>({...JSON.parse(row.payload),version:row.version,createdAt:row.created_at,updatedAt:row.updated_at,authorId:row.author_id}));},
    get(kind,id){const row=db.prepare('SELECT * FROM content WHERE kind=? AND id=?').get(kind,id);return row?{...JSON.parse(row.payload),version:row.version,createdAt:row.created_at,updatedAt:row.updated_at,authorId:row.author_id}:null;},
    put(kind,value,actor,expected){
      db.exec('BEGIN IMMEDIATE');
      try {
        const previous=db.prepare('SELECT * FROM content WHERE kind=? AND id=?').get(kind,value.id);
        if (previous && expected!==previous.version) {const e=new Error('This record changed. Reload it before saving.');e.status=409;throw e;}
        if (!previous && expected) {const e=new Error('This record no longer exists.');e.status=409;throw e;}
        if (previous) db.prepare('INSERT INTO revisions(kind,content_id,payload,version,actor,created_at) VALUES(?,?,?,?,?,?)').run(kind,value.id,previous.payload,previous.version,actor,now());
        const timestamp=now();
        db.prepare(`INSERT INTO content(kind,id,payload,version,created_at,updated_at,author_id) VALUES(?,?,?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET payload=excluded.payload,version=excluded.version,updated_at=excluded.updated_at`).run(kind,value.id,JSON.stringify(value),(previous?.version||0)+1,previous?.created_at||timestamp,timestamp,previous?.author_id||actor);
        db.prepare('INSERT INTO audit(actor,action,resource,created_at) VALUES(?,?,?,?)').run(actor,previous?'update':'create',`${kind}/${value.id}`,timestamp);
        db.exec('COMMIT');return store.get(kind,value.id);
      }catch(e){db.exec('ROLLBACK');throw e;}
    },
    audit(actor,action,resource){db.prepare('INSERT INTO audit(actor,action,resource,created_at) VALUES(?,?,?,?)').run(actor,action,resource,now());},
    enqueue(id,type,payload){db.prepare('INSERT OR IGNORE INTO jobs(id,type,payload,next_at,created_at) VALUES(?,?,?,?,?)').run(id,type,JSON.stringify(payload),Date.now(),now());},
    close(){db.close();},
  };
  if (!db.prepare("SELECT value FROM meta WHERE key='seeded'").get()) {
    CONTENT_KINDS.forEach(kind=>(seed[kind]||[]).forEach(value=>store.put(kind,value,'seed')));
    db.prepare('INSERT INTO meta(key,value) VALUES(?,?)').run('settings',JSON.stringify(seed.settings||{}));
    db.prepare('INSERT INTO meta(key,value) VALUES(?,?)').run('seeded',now());
  }
  return store;
}
