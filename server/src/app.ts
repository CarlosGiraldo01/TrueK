import cors from 'cors';
import express from 'express';
import { config } from './config';
import { usersRouter } from './features/users/users.router';
import { postsRouter } from './features/posts/posts.router';
import { requestsRouter } from './features/requests/requests.router';
import { ratingsRouter } from './features/ratings/ratings.router';
import { messagesRouter } from './features/messages/messages.router';
import { notificationsRouter } from './features/notifications/notifications.router';

export const app = express();
//mas rutas 
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});
//rutas 
app.use('/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/requests', requestsRouter);
app.use('/ratings', ratingsRouter);
app.use('/messages', messagesRouter);
app.use('/notifications',  notificationsRouter);