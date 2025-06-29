
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { 
  registerSchema, 
  loginSchema, 
  resetPasswordSchema, 
  newPasswordSchema,
  type LoginInput,
  type RegisterInput 
} from "@shared/schema";

// Use default values for development if not provided
const JWT_SECRET = process.env.JWT_SECRET || "development-jwt-secret-change-in-production";
const SESSION_SECRET = process.env.SESSION_SECRET || "development-session-secret-change-in-production";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Register route
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(data.password);
      const userId = crypto.randomUUID();
      
      const isAdmin = data.email === (process.env.ADMIN_USER_ID || "sorokomarco@gmail.com");
      
      const user = await storage.createUser({
        id: userId,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        isAdmin: isAdmin,
      });

      // Generate auth token and set session
      const token = generateToken({ userId: user.id, email: user.email });
      (req.session as any).user = { id: user.id, email: user.email };

      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          level: user.level,
          xp: user.xp,
        },
        token 
      });
    } catch (error) {
      console.error("Register error:", error);
      
      // Gestion des erreurs de validation Zod
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as any;
        const firstIssue = zodError.issues?.[0];
        return res.status(400).json({ 
          message: firstIssue?.message || "Données invalides" 
        });
      }
      
      // Gestion des erreurs de base de données
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === '23505') { // Violation de contrainte unique
          return res.status(400).json({ 
            message: "Un utilisateur avec cet email existe déjà" 
          });
        }
      }
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erreur lors de l'inscription" });
      }
    }
  });

  // Login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(400).json({ message: "Email ou mot de passe incorrect" });
      }

      // Verify password
      const isValidPassword = await comparePassword(data.password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Email ou mot de passe incorrect" });
      }

      // Generate auth token and set session
      const token = generateToken({ userId: user.id, email: user.email });
      (req.session as any).user = { id: user.id, email: user.email };

      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          level: user.level,
          xp: user.xp,
        },
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      
      // Gestion des erreurs de validation Zod
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as any;
        const firstIssue = zodError.issues?.[0];
        return res.status(400).json({ 
          message: firstIssue?.message || "Données invalides" 
        });
      }
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erreur lors de la connexion" });
      }
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Déconnexion réussie" });
    });
  });

  // Get current user route
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        isAdmin: user.isAdmin,
        level: user.level,
        xp: user.xp,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionUser = (req.session as any)?.user;

    let userId: string | null = null;

    // Check session first
    if (sessionUser && sessionUser.id) {
      userId = sessionUser.id;
    }
    
    // Check JWT token
    else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyToken(token);
        userId = decoded.userId;
      } catch (error) {
        // Token invalid, continue to check session
      }
    }

    // Check session
    if (!userId && sessionUser) {
      userId = sessionUser.id;
    }

    if (!userId) {
      return res.status(401).json({ message: "Non autorisé" });
    }

    // Verify user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Non autorisé" });
  }
};
