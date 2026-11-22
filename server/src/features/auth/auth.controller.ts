import Boom from '@hapi/boom';
import type { NextFunction, Request, Response } from 'express';
import { authService } from './auth.service';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body ?? {};

      if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        throw Boom.badRequest('Debes ingresar correo y contraseña');
      }

      const result = await authService.login({ email, password });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body ?? {};

      if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !password || typeof password !== 'string') {
        throw Boom.badRequest('Todos los campos son obligatorios');
      }

      if (password.length < 6) {
        throw Boom.badRequest('La contraseña debe tener al menos 6 caracteres');
      }

      const validRole = role === 'provider' ? 'provider' : 'client';
      const result = await authService.register({ name, email, password, role: validRole });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
};