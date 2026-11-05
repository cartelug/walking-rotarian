// Bootstrap through stdin only. Never put an administrator password in a command or source file.
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { openStore } from './store.mjs';
import { passwordHash } from './security.mjs';
let raw='';for await(const chunk of process.stdin)raw+=chunk;
const {email,name,password}=JSON.parse(raw);
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email||'')||!name)throw new Error('A name and valid email are required.');
const seed=JSON.parse(fs.readFileSync(path.resolve(process.env.STATIC_DIR||'dist','data/platform.json'),'utf8'));
const store=openStore(path.resolve(process.env.DATA_DIR||'runtime'),seed);
if(store.db.prepare("SELECT id FROM users WHERE role='owner'").get())throw new Error('An owner already exists. Use the authenticated studio to manage accounts.');
store.db.prepare('INSERT INTO users(id,email,name,role,password_hash) VALUES(?,?,?,?,?)').run(randomUUID(),email.toLowerCase(),name,'owner',passwordHash(password));
store.close();console.log('Owner account created.');
