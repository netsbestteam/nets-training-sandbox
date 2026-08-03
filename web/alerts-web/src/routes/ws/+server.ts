import { logger } from '@shared-backend/logger/index';
import { PUBLIC_ALERTS_WEBSOCKET_URL } from '$env/static/public';
import type { RequestHandler } from './$types';
import WSModule from 'ws';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	const token = cookies.get('session_token') || locals.user?.token;

	if (!token) {
		return new Response('Unauthorized', { status: 401 });
	}

	const stream = new ReadableStream({
		start(controller) {
			logger.info('connecting to the websocket services');

			let secureSocket: any = null;

			try {
				const WebSocketClient = WSModule;

				secureSocket = new WebSocketClient(PUBLIC_ALERTS_WEBSOCKET_URL, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				secureSocket.on('open', () => {
					logger.info('connected');
				});

				secureSocket.on('message', (data: any) => {
					try {
						controller.enqueue(`data: ${data.toString()}\n\n`);
					} catch (e) {
						// Drop trailing messages if client closed early
					}
				});

				secureSocket.on('close', () => {
					logger.info('disconnected');
					try {
						controller.close();
					} catch (e) {}
				});

				secureSocket.on('error', (err: any) => {
					logger.error('error:', err);
					try {
						controller.close();
					} catch (e) {}
				});
			} catch (initErr) {
				logger.error('Initialization error:' + initErr);
				try {
					controller.close();
				} catch (e) {}
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
