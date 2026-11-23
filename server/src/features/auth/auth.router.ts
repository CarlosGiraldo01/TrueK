import { Router } from 'express';
import { authController } from './auth.controller';

const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.post('/register', authController.register);

export { authRouter };
export default authRouter;