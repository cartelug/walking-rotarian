import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
export const token=()=>randomBytes(32).toString('base64url');
export const digest=value=>createHash('sha256').update(String(value)).digest('hex');
export function passwordHash(password){
  if(typeof password!=='string'||password.length<12||password.length>256)throw new Error('Use a password of 12-256 characters.');
  const salt=randomBytes(16).toString('hex');return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;
}
export function passwordMatches(password,hash){
  if(typeof password!=='string'||password.length>256)return false;
  try{const [salt,stored]=hash.split(':');const actual=scryptSync(password,salt,64);const expected=Buffer.from(stored,'hex');return expected.length===actual.length&&timingSafeEqual(actual,expected);}catch{return false;}
}
export function sessionFor(req,store){
  const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('wr_session='))?.slice(11);
  if(!raw)return null;
  return store.db.prepare('SELECT s.*,u.name,u.email,u.role,u.active FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').get(digest(raw),Date.now())||null;
}
export function safeUser(u){return u?{id:u.user_id||u.id,name:u.name,email:u.email,role:u.role}:null;}
export function requireRole(session,roles){if(!session){const e=new Error('Sign in to continue.');e.status=401;throw e;}if(!roles.includes(session.role)){const e=new Error('Your account cannot perform this action.');e.status=403;throw e;}}
export function makeLimiter(){const windows=new Map();return (key,max=20,windowMs=60000)=>{const now=Date.now();let w=windows.get(key);if(!w||now>w.until){w={count:0,until:now+windowMs};windows.set(key,w);}if(++w.count>max){const e=new Error('Too many requests. Try again shortly.');e.status=429;throw e;}if(windows.size>10000)for(const [k,v]of windows)if(v.until<now)windows.delete(k);};}
