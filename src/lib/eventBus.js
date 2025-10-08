import { EventEmitter } from 'events';

const bus = new EventEmitter();
bus.setMaxListeners(50);

export function emitEvent(channel, payload) {
  bus.emit(channel, payload);
}

export function subscribe(channel, listener) {
  bus.on(channel, listener);
  return () => bus.off(channel, listener);
}

export { bus };
