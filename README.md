# Quiz & Chat Backend

API backend Express.js/TypeScript pour déploiement sur Koyeb.

## Configuration Koyeb

1. **Connecter le repository** : Importez ce dossier backend dans Koyeb
2. **Variables d'environnement** :
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=votre-jwt-secret-key
   SESSION_SECRET=votre-session-secret-key
   NODE_ENV=production
   PORT=5000
   CORS_ORIGIN=https://votre-frontend-vercel.app
   ```
3. **Build Settings** :
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Port: 5000

## Développement local

```bash
npm install
npm run dev
```

L'API se lance sur http://localhost:5000

## Structure

- `/server` - Code source Express.js/TypeScript
- `/shared` - Types et schémas partagés avec le frontend
- `/migrations` - Migrations de base de données Drizzle
- `drizzle.config.ts` - Configuration Drizzle ORM

## Endpoints API

- `GET /api/auth/user` - Utilisateur connecté
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/quizzes` - Liste des quiz
- `GET /api/posts` - Articles admin
- `GET /api/users/leaderboard` - Classement
- Et plus...