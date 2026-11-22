import { randomUUID } from 'node:crypto';
import Boom from '@hapi/boom';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { usersRepository } from '../users/users.repository';
import type { AuthResponse, LoginInput, RegisterInput, SafeUser } from './auth.types';

function createToken(user: SafeUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' },
  );
}

export const authService = {
  async login({ email, password }: LoginInput): Promise<AuthResponse> {
    const foundUser = await usersRepository.findByEmailWithPassword(email);

    if (!foundUser || !foundUser.password) {
      throw Boom.unauthorized('Correo o contraseña incorrectos');
    }

    const isPasswordValid = await bcrypt.compare(password, foundUser.password);
    if (!isPasswordValid) {
      throw Boom.unauthorized('Correo o contraseña incorrectos');
    }

    const { password: _ignored, ...safeUser } = foundUser;
    const token = createToken(safeUser as SafeUser);

    return { token, user: safeUser as SafeUser };
  },

  async register({ name, email, password, role = 'client' }: RegisterInput): Promise<AuthResponse> {
    const existingUser = await usersRepository.findByEmailWithPassword(email);
    if (existingUser) {
      throw Boom.conflict('Ya existe una cuenta registrada con ese correo');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await usersRepository.createUser({
      id: randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
    });

    const { password: _ignored, ...safeUser } = createdUser;
    const token = createToken(safeUser as SafeUser);

    return { token, user: safeUser as SafeUser };
  },
};