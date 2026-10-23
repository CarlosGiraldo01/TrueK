import { app } from './app';
import { config } from './config';

if(!process.env.VERCEL) {
    app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
    });
}

export default app;