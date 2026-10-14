import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

const bridge = window.__gohanoNative__;

export const BRIDGE_AVAILABLE = !!bridge;

// Outbound web calls wait in pending; inbound native calls dispatch through handlers.
const pending = new Map();
const handlers = new Map();

const post = message => bridge.postMessage(JSON.stringify(message));

export const call = (method, data = {}, opts = {}) => {
	if (!BRIDGE_AVAILABLE) throw new Meteor.Error('bridge', 'No native bridge available');

	const {onUpdate, signal} = opts;
	return new Promise((resolve, reject) => {
		const id = Random.id();

		const abort = () => {
			pending.delete(id);
			signal?.removeEventListener('abort', abort);
			post({'method': 'bridge.abort', 'requestId': id});
			reject(new DOMException('The operation was aborted.', 'AbortError'));
		};
		if (signal?.aborted) return abort();

		pending.set(id, {resolve, reject, onUpdate, signal, abort, 'updates': Promise.resolve()});
		signal?.addEventListener('abort', abort, {'once': true});
		post({id, method, ...data});
	});
};

// Register a web-side endpoint for reverse RPC calls initiated by native code.
// The handler's return value or error is posted back using the native request ID.
export const on = (method, handler) => {
	handlers.set(method, handler);
	return () => {
		if (handlers.get(method) === handler) handlers.delete(method);
	};
};

if (BRIDGE_AVAILABLE) bridge.onmessage = ({data}) => {
	const response = JSON.parse(data);
	// A method marks a native-to-web request; other messages answer a Bridge.call request.
	if (response.method) {
		const handler = handlers.get(response.method);
		if (!handler) {
			post({
				'id': response.id,
				'error': {'error': 'unsupported_method', 'reason': `Unsupported client method: ${response.method}`},
			});
			return;
		}
		Promise.resolve(handler(response.data)).then(
			result => post({'id': response.id, result}),
			error => post({
				'id': response.id,
				'error': {
					'error': error.error || 'client_error',
					'reason': error.reason || error.message,
					'details': error.details,
				},
			}),
		);
		return;
	}

	const promise = pending.get(response.id);
	if (!promise) return;

	// Streaming RPCs send updates and a keep-alive acknowledgement before final completion.
	if ('update' in response) {
		// Process updates in order; callback failures also cancel the native operation.
		promise.updates = promise.updates.then(() => promise.onUpdate?.(response.update));
		promise.updates.catch(error => {
			promise.reject(error);
			if (pending.has(response.id)) promise.abort();
		});
		return;
	}

	if (!response.keep) {
		pending.delete(response.id);
		promise.signal?.removeEventListener('abort', promise.abort);
	}

	if (response.error) {
		promise.reject(new Meteor.Error(response.error.error, response.error.reason, response.error.details));
	} else {
		promise.updates.then(() => promise.resolve(response.result), promise.reject);
	}
};
