// A small in-memory Firestore for the study desk's server tests (decision 0082): docs,
// subcollections, get/getAll/set(merge)/update, collection get, transactions, and the
// three sentinels the server writes (increment, arrayUnion, serverTimestamp). Enough
// for lib/study/server.ts; not a general emulator.
function kind(v) {
  return v && typeof v === 'object' ? v.constructor && v.constructor.name : '';
}
function isPlain(v) {
  return v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
}
function apply(old, v) {
  const k = kind(v);
  if (k === 'NumericIncrementTransform') return (typeof old === 'number' ? old : 0) + v.operand;
  if (k === 'ArrayUnionTransform') {
    const base = Array.isArray(old) ? old.slice() : [];
    for (const e of v.elements) if (!base.includes(e)) base.push(e);
    return base;
  }
  if (k === 'ServerTimestampTransform') return new Date();
  return v;
}
function mergeInto(target, data) {
  for (const [key, v] of Object.entries(data)) {
    if (isPlain(v) && isPlain(target[key])) mergeInto(target[key], v);
    else if (isPlain(v)) { target[key] = {}; mergeInto(target[key], v); }
    else target[key] = apply(target[key], v);
  }
}
function resolveAll(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) out[k] = isPlain(v) ? resolveAll(v) : apply(undefined, v);
  return out;
}

export class FakeDb {
  constructor() { this.docs = new Map(); this.writes = []; }
  collection(name) { return new Col(this, name); }
  async getAll(...refs) { return refs.map((r) => r._snap()); }
  async runTransaction(fn) {
    const pending = [];
    const t = {
      get: async (ref) => ref._snap(),
      getAll: async (...refs) => refs.map((r) => r._snap()),
      set: (ref, data, opts) => { pending.push(() => ref._set(data, opts)); return t; },
      update: (ref, data) => { pending.push(() => ref._update(data)); return t; },
    };
    const out = await fn(t);
    for (const w of pending) w();
    return out;
  }
  seed(path, data) { this.docs.set(path, structuredClone(data)); }
  read(path) { return this.docs.get(path); }
}
class Col {
  constructor(db, path) { this.db = db; this.path = path; }
  doc(id) { return new Doc(this.db, `${this.path}/${id}`); }
  async get() {
    const prefix = this.path + '/';
    const docs = [];
    for (const [p, d] of this.db.docs) {
      const rest = p.slice(prefix.length);
      if (p.startsWith(prefix) && !rest.includes('/')) docs.push(new Snap(rest, d));
    }
    return { docs, size: docs.length };
  }
}
class Snap {
  constructor(id, d) { this.id = id; this._d = d; this.exists = d !== undefined; }
  data() { return this._d === undefined ? undefined : structuredClone(this._d); }
}
class Doc {
  constructor(db, path) { this.db = db; this.path = path; this.id = path.split('/').pop(); }
  collection(name) { return new Col(this.db, `${this.path}/${name}`); }
  _snap() { return new Snap(this.id, this.db.docs.get(this.path)); }
  async get() { return this._snap(); }
  _set(data, opts) {
    this.db.writes.push({ path: this.path, data });
    if (opts && opts.merge) {
      const cur = this.db.docs.get(this.path) || {};
      mergeInto(cur, data);
      this.db.docs.set(this.path, cur);
    } else this.db.docs.set(this.path, resolveAll(data));
  }
  _update(data) {
    const cur = this.db.docs.get(this.path);
    if (!cur) throw new Error(`no document to update: ${this.path}`);
    this.db.writes.push({ path: this.path, data });
    for (const [k, v] of Object.entries(data)) cur[k] = apply(cur[k], v);
  }
  async set(data, opts) { this._set(data, opts); }
  async update(data) { this._update(data); }
}
