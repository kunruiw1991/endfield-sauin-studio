// Synchronous pub/sub event bus per docs/DESIGN.md §4.2 (owner: core).

export function createEventBus() {
  const buckets = new Map();

  function off(type, fn) {
    const set = buckets.get(type);
    if (!set) return;
    set.delete(fn);
    if (set.size === 0) {
      buckets.delete(type);
    }
  }

  function on(type, fn) {
    if (typeof type !== 'string' || typeof fn !== 'function') {
      return () => {};
    }
    let set = buckets.get(type);
    if (!set) {
      set = new Set();
      buckets.set(type, set);
    }
    set.add(fn);
    return () => off(type, fn);
  }

  function once(type, fn) {
    if (typeof type !== 'string' || typeof fn !== 'function') {
      return () => {};
    }
    const wrapper = (payload) => {
      off(type, wrapper);
      fn(payload);
    };
    return on(type, wrapper);
  }

  function emit(type, payload) {
    const set = buckets.get(type);
    if (!set || set.size === 0) return;
    const handlers = Array.from(set);
    for (let i = 0; i < handlers.length; i++) {
      handlers[i](payload);
    }
  }

  function clear(type) {
    if (typeof type === 'string') {
      buckets.delete(type);
    } else {
      buckets.clear();
    }
  }

  return {
    on,
    once,
    off,
    emit,
    clear,
  };
}

export const createEvents = createEventBus;
