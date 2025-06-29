import {
  users,
  quizzes,
  quizResults,
  chatRooms,
  chatMessages,
  chatRoomMembers,
  adminPosts,

  type User,
  type UpsertUser,
  type UpdateUserProfile,
  type Quiz,
  type InsertQuiz,
  type QuizResult,
  type InsertQuizResult,
  type ChatRoom,
  type InsertChatRoom,
  type ChatMessage,
  type InsertChatMessage,
  type ChatRoomMember,
  type InsertChatRoomMember,
  type AdminPost,
  type InsertAdminPost,

} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, count, sql, and } from "drizzle-orm";
import { inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserXP(userId: string, xpToAdd: number): Promise<User>;









  // Quiz operations
  getQuizzes(): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getFeaturedQuiz(): Promise<Quiz | undefined>;

  // Quiz results operations
  getUserQuizResults(userId: string): Promise<QuizResult[]>;
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getUserStats(userId: string): Promise<{
    totalQuizzes: number;
    totalXP: number;
    rank: number;
  }>;



  // Profile operations
  updateUserProfile(userId: string, profile: UpdateUserProfile): Promise<User>;

  // Chat operations
  getChatRooms(userId?: string): Promise<ChatRoom[]>;
  getChatRoom(id: number): Promise<ChatRoom | undefined>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  getChatMessages(roomId: number, limit?: number): Promise<ChatMessage[]>;
  sendChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  joinChatRoom(membership: InsertChatRoomMember): Promise<ChatRoomMember>;
  getUserChatRooms(userId: string): Promise<ChatRoom[]>;

  // Admin operations
  getAdminPosts(published?: boolean): Promise<any[]>;
  getAdminPost(id: number): Promise<AdminPost | undefined>;
  createAdminPost(post: InsertAdminPost): Promise<AdminPost>;
  updateAdminPost(id: number, updates: Partial<InsertAdminPost>): Promise<AdminPost>;
  deleteAdminPost(id: number): Promise<void>;
  getPublicPosts(): Promise<any[]>;
  
  // Posts operations for frontend
  getPublishedPosts(): Promise<AdminPost[]>;
  getPost(id: number): Promise<AdminPost | undefined>;
  createPost(post: InsertAdminPost): Promise<AdminPost>;
  

  
  // Extended admin operations
  getUsersPaginated(limit: number, offset: number): Promise<User[]>;
  updateUserAdmin(userId: string, updates: any): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  deleteQuiz(quizId: number): Promise<void>;
  updateQuiz(quizId: number, updates: any): Promise<Quiz>;

  deleteChatMessage(messageId: number): Promise<void>;
  cleanupOldSessions(): Promise<void>;
  cleanupUnusedData(): Promise<void>;

  // Utility operations
  ensureDefaultChatRoom(): Promise<void>;
  ensureAdminUser(): Promise<void>;
  getPlatformStats(): Promise<{
    totalUsers: number;
    totalQuizzes: number;
    totalMessages: number;
    totalPosts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserXP(userId: string, xpToAdd: number): Promise<User> {
    // Get current user data
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!currentUser) throw new Error("User not found");

    const newXP = (currentUser.xp || 0) + xpToAdd;
    
    // Calculate new level based on XP (every 100 XP = 1 level)
    const newLevel = Math.floor(newXP / 100) + 1;

    const [updatedUser] = await db
      .update(users)
      .set({
        xp: newXP,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    console.log(`User ${userId} XP updated: ${currentUser.xp} → ${newXP}, Level: ${currentUser.level} → ${newLevel}`);
    return updatedUser;
  }





  // Manga operations











  // Download operations





  // Quiz operations
  async getQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    try {
      const quiz = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, id))
        .limit(1);

      if (!quiz[0]) {
        return undefined;
      }

      const quizData = quiz[0];
      console.log("Raw quiz data from DB:", quizData);

      // Parse questions if they're stored as JSON string
      if (typeof quizData.questions === 'string') {
        try {
          quizData.questions = JSON.parse(quizData.questions);
        } catch (parseError) {
          console.error("Error parsing questions JSON:", parseError);
          quizData.questions = [];
        }
      }

      console.log("Processed quiz data:", quizData);
      return quizData;
    } catch (error) {
      console.error("Error getting quiz:", error);
      throw error;
    }
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async deleteAllQuizzes(): Promise<void> {
    // Delete all quiz results first (foreign key constraint)
    await db.delete(quizResults);
    // Then delete all quizzes
    await db.delete(quizzes);
  }

  async cleanupDuplicateQuizzes(): Promise<void> {
    // Delete auto-generated quiz duplicates, keeping only unique titles
    const allQuizzes = await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
    const seenTitles = new Set();
    const toDelete = [];

    for (const quiz of allQuizzes) {
      if (seenTitles.has(quiz.title) || quiz.title.includes('Quiz Anime du Jour')) {
        toDelete.push(quiz.id);
      } else {
        seenTitles.add(quiz.title);
      }
    }

    // Delete quiz results for duplicates first
    if (toDelete.length > 0) {
      await db.delete(quizResults).where(inArray(quizResults.quizId, toDelete));
      await db.delete(quizzes).where(inArray(quizzes.id, toDelete));
    }
  }

  async getFeaturedQuiz(): Promise<Quiz | undefined> {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.difficulty, "hard"))
      .orderBy(desc(quizzes.xpReward))
      .limit(1);
    return quiz;
  }

  // Quiz results operations
  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return await db
      .select()
      .from(quizResults)
      .where(eq(quizResults.userId, userId))
      .orderBy(desc(quizResults.completedAt));
  }

  async createQuizResult(result: InsertQuizResult): Promise<QuizResult> {
    const [newResult] = await db.insert(quizResults).values(result).returning();
    
    // Update user XP if xpEarned is provided
    if (result.xpEarned && result.xpEarned > 0) {
      await this.updateUserXP(result.userId, result.xpEarned);
    }
    
    return newResult;
  }

  async getUserStats(userId: string): Promise<{
    totalQuizzes: number;
    totalXP: number;
    rank: number;
    level: number;
  }> {
    const [quizCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quizResults)
      .where(eq(quizResults.userId, userId));

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    const [rankResult] = await db
      .select({ rank: sql<number>`COUNT(*) + 1` })
      .from(users)
      .where(sql`${users.xp} > ${user?.xp || 0}`);

    return {
      totalQuizzes: quizCount?.count || 0,
      totalXP: user?.xp || 0,
      rank: rankResult?.rank || 1,
      level: user?.level || 1,
    };
  }

  async getLeaderboard(limit: number = 10): Promise<any[]> {
    const topUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.email, // Using email as username fallback
        profileImageUrl: users.profileImageUrl,
        xp: users.xp,
        level: users.level,
        isAdmin: users.isAdmin
      })
      .from(users)
      .orderBy(desc(users.xp), desc(users.level))
      .limit(limit);

    // Ensure profile image URLs are properly returned
    return topUsers.map(user => ({
      ...user,
      profileImageUrl: user.profileImageUrl || null
    }));
  }



  // Profile operations
  async updateUserProfile(userId: string, profile: UpdateUserProfile): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Chat operations
  async getChatRooms(userId?: string): Promise<ChatRoom[]> {
    if (userId) {
      return await db
        .select({
          id: chatRooms.id,
          name: chatRooms.name,
          description: chatRooms.description,
          isPrivate: chatRooms.isPrivate,
          createdBy: chatRooms.createdBy,
          createdAt: chatRooms.createdAt,
        })
        .from(chatRooms)
        .innerJoin(chatRoomMembers, eq(chatRoomMembers.roomId, chatRooms.id))
        .where(eq(chatRoomMembers.userId, userId))
        .orderBy(desc(chatRooms.createdAt));
    }
    return await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.isPrivate, false))
      .orderBy(desc(chatRooms.createdAt));
  }

  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return room;
  }

  async createChatRoom(room: InsertChatRoom): Promise<ChatRoom> {
    const [newRoom] = await db.insert(chatRooms).values(room).returning();
    // Auto-join the creator
    await db.insert(chatRoomMembers).values({
      roomId: newRoom.id,
      userId: room.createdBy,
    });
    return newRoom;
  }

  async getChatMessages(roomId: number, limit: number = 100): Promise<any[]> {
    const results = await db
      .select({
        id: chatMessages.id,
        content: chatMessages.message,
        userId: chatMessages.userId,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userProfileImageUrl: users.profileImageUrl,
        isAdmin: users.isAdmin,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt)) // Messages les plus récents en dernier
      .limit(limit);

    // Retourner les messages dans l'ordre chronologique (inverser car on a trié par desc)
    return results.reverse().map(result => ({
      ...result,
      timestamp: result.createdAt, // Assurer la compatibilité
      username: result.userFirstName || 'Utilisateur' // Fallback pour le nom
    }));
  }

  async sendChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    // Ensure the structure matches the database schema
    const messageData = {
      message: message.message,
      userId: message.userId,
      roomId: message.roomId || 1,
      messageType: message.messageType || 'text'
    };
    
    const [newMessage] = await db.insert(chatMessages).values(messageData).returning();
    return newMessage;
  }

  async joinChatRoom(membership: InsertChatRoomMember): Promise<ChatRoomMember> {
    const [newMember] = await db.insert(chatRoomMembers).values(membership).returning();
    return newMember;
  }

  async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    return await db
      .select({
        id: chatRooms.id,
        name: chatRooms.name,
        description: chatRooms.description,
        isPrivate: chatRooms.isPrivate,
        createdBy: chatRooms.createdBy,
        createdAt: chatRooms.createdAt,
      })
      .from(chatRooms)
      .innerJoin(chatRoomMembers, eq(chatRoomMembers.roomId, chatRooms.id))
      .where(eq(chatRoomMembers.userId, userId))
      .orderBy(desc(chatRooms.createdAt));
  }

  // Public posts operations
  async getPublicPosts(): Promise<any[]> {
    return await db.select({
      id: adminPosts.id,
      title: adminPosts.title,
      content: adminPosts.content,
      type: adminPosts.type,
      isPublished: adminPosts.isPublished,
      adminOnly: adminPosts.adminOnly,
      authorId: adminPosts.authorId,
      imageUrl: adminPosts.imageUrl,
      createdAt: adminPosts.createdAt,
      updatedAt: adminPosts.updatedAt,
      authorName: users.firstName,
      authorLastName: users.lastName,
      authorProfileImageUrl: users.profileImageUrl,
    })
    .from(adminPosts)
    .leftJoin(users, eq(adminPosts.authorId, users.id))
    .where(and(eq(adminPosts.isPublished, true), eq(adminPosts.adminOnly, false)))
    .orderBy(desc(adminPosts.createdAt));
  }

  // Admin operations
  async getAdminPosts(published?: boolean): Promise<any[]> {
    const query = db.select({
      id: adminPosts.id,
      title: adminPosts.title,
      content: adminPosts.content,
      type: adminPosts.type,
      isPublished: adminPosts.isPublished,
      adminOnly: adminPosts.adminOnly,
      authorId: adminPosts.authorId,
      imageUrl: adminPosts.imageUrl,
      createdAt: adminPosts.createdAt,
      updatedAt: adminPosts.updatedAt,
      authorName: users.firstName,
      authorLastName: users.lastName,
      authorProfileImageUrl: users.profileImageUrl,
    })
    .from(adminPosts)
    .leftJoin(users, eq(adminPosts.authorId, users.id));

    if (published !== undefined) {
      query.where(eq(adminPosts.isPublished, published));
    }

    return await query.orderBy(desc(adminPosts.createdAt));
  }

  async getAdminPost(id: number): Promise<AdminPost | undefined> {
    const [post] = await db.select().from(adminPosts).where(eq(adminPosts.id, id));
    return post;
  }

  async createAdminPost(post: InsertAdminPost): Promise<AdminPost> {
    const [newPost] = await db.insert(adminPosts).values(post).returning();
    return newPost;
  }

  async updateAdminPost(id: number, updates: Partial<InsertAdminPost>): Promise<AdminPost> {
    const [updatedPost] = await db
      .update(adminPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteAdminPost(id: number): Promise<void> {
    await db.delete(adminPosts).where(eq(adminPosts.id, id));
  }

  // Ensure admin user exists
  async ensureAdminUser(): Promise<void> {
    try {
      const adminUser = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);

      if (adminUser.length === 0) {
        // Check if there's a user that should be admin
        const adminEmail = process.env.ADMIN_USER_ID || "sorokomarco@gmail.com";
        const potentialAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

        if (potentialAdmin.length > 0) {
          // Make this user admin
          await db.update(users)
            .set({ isAdmin: true })
            .where(eq(users.id, potentialAdmin[0].id));
        }
      }
    } catch (error) {
      console.error("Error ensuring admin user:", error);
    }
  }

  // Ensure default chat room exists
  async ensureDefaultChatRoom(): Promise<void> {
    try {
      const existingRoom = await db.select().from(chatRooms).where(eq(chatRooms.id, 1)).limit(1);

      if (existingRoom.length === 0) {
        // Get the first admin user to be the creator, or create with a real user
        const adminUser = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);

        if (adminUser.length > 0) {
          // Create default room with admin as creator
          await db.insert(chatRooms).values({
            name: "General Discussion",
            description: "Welcome to the general chat! Discuss quiz and more!",
            isPrivate: false,
            createdBy: adminUser[0].id
          }).onConflictDoNothing();
          console.log("Created default chat room with ID 1");
        } else {
          console.log("No admin user found for chat room creation");
        }
      }
    } catch (error: any) {
      if (!error.message.includes('duplicate') && !error.message.includes('unique constraint')) {
        console.error("Error ensuring default chat room:", error);
      }
    }
  }

  // Get platform statistics for admin dashboard
  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalQuizzes: number;
    totalMessages: number;
    totalPosts: number;
  }> {
    try {
      const [usersCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);

      const [quizzesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(quizzes);

      const [messagesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatMessages);

      const [postsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adminPosts);

      return {
        totalUsers: usersCount?.count || 0,
        totalQuizzes: quizzesCount?.count || 0,
        totalMessages: messagesCount?.count || 0,
        totalPosts: postsCount?.count || 0,
      };
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      return {
        totalUsers: 0,
        totalQuizzes: 0,
        totalMessages: 0,
        totalPosts: 0,
      };
    }
  }

  // Extended admin operations
  async getUsersPaginated(limit: number, offset: number): Promise<User[]> {
    return await db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt));
  }

  async updateUserAdmin(userId: string, updates: any): Promise<User> {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  async deleteQuiz(quizId: number): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, quizId));
  }

  async updateQuiz(quizId: number, updates: any): Promise<Quiz> {
    const [updatedQuiz] = await db.update(quizzes).set(updates).where(eq(quizzes.id, quizId)).returning();
    return updatedQuiz;
  }




  async deleteChatMessage(messageId: number): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.id, messageId));
  }

  async cleanupOldSessions(): Promise<void> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await db.execute(sql`DELETE FROM sessions WHERE expires < ${oneWeekAgo}`);
  }

  async cleanupUnusedData(): Promise<void> {
    // Clean up quiz results for deleted quizzes
    await db.delete(quizResults).where(sql`${quizResults.quizId} NOT IN (SELECT id FROM ${quizzes})`);
    

  }

  // Posts operations for frontend
  async getPublishedPosts(): Promise<AdminPost[]> {
    return await db.select().from(adminPosts).where(eq(adminPosts.isPublished, true)).orderBy(desc(adminPosts.createdAt));
  }

  async getPost(id: number): Promise<AdminPost | undefined> {
    const [post] = await db.select().from(adminPosts).where(eq(adminPosts.id, id));
    return post;
  }

  async createPost(postData: InsertAdminPost): Promise<AdminPost> {
    const [post] = await db.insert(adminPosts).values(postData).returning();
    return post;
  }


}

export const storage = new DatabaseStorage();