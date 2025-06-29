CREATE TABLE "admin_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" text NOT NULL,
	"is_published" boolean DEFAULT false,
	"admin_only" boolean DEFAULT false,
	"author_id" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "anime_episodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"episode_id" text NOT NULL,
	"title" text NOT NULL,
	"episode_number" integer NOT NULL,
	"language" text NOT NULL,
	"url" text,
	"available" boolean DEFAULT true,
	"streaming_sources" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "anime_episodes_episode_id_unique" UNIQUE("episode_id")
);
--> statement-breakpoint
CREATE TABLE "anime_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"anime_id" integer NOT NULL,
	"rating" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "anime_seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"anime_id" integer NOT NULL,
	"season_number" integer NOT NULL,
	"name" text NOT NULL,
	"languages" text[],
	"episode_count" integer DEFAULT 0,
	"url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "anime_watching_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"anime_id" integer NOT NULL,
	"season_id" integer,
	"episode_id" integer,
	"current_episode" integer DEFAULT 1,
	"total_episodes" integer,
	"watched_minutes" integer DEFAULT 0,
	"total_minutes" integer,
	"status" text DEFAULT 'watching',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "animes" (
	"id" serial PRIMARY KEY NOT NULL,
	"anime_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"status" text,
	"genres" text[],
	"year" text,
	"type" text,
	"total_episodes" integer,
	"has_films" boolean DEFAULT false,
	"has_scans" boolean DEFAULT false,
	"correspondence" text,
	"advancement" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "animes_anime_id_unique" UNIQUE("anime_id")
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"type" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "auth_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"message" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_room_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_private" boolean DEFAULT false,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manga_chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"mangadx_id" varchar NOT NULL,
	"manga_id" integer NOT NULL,
	"chapter_number" text NOT NULL,
	"title" text,
	"volume" text,
	"pages" integer DEFAULT 0,
	"translated_language" text DEFAULT 'fr',
	"scanlation_group" text,
	"publish_at" timestamp,
	"readable_at" timestamp,
	"version" integer DEFAULT 1,
	"hash" text,
	"data" text[],
	"data_saver" text[],
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "manga_chapters_mangadx_id_unique" UNIQUE("mangadx_id")
);
--> statement-breakpoint
CREATE TABLE "manga_downloads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"chapter_id" integer NOT NULL,
	"download_url" text,
	"status" text DEFAULT 'pending',
	"downloaded_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manga_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"manga_id" integer NOT NULL,
	"rating" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manga_reading_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"manga_id" integer NOT NULL,
	"last_chapter_id" integer,
	"last_page_number" integer DEFAULT 1,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mangas" (
	"id" serial PRIMARY KEY NOT NULL,
	"mal_id" integer NOT NULL,
	"title" text NOT NULL,
	"synopsis" text,
	"image_url" text,
	"score" text,
	"year" integer,
	"status" text,
	"chapters" integer,
	"volumes" integer,
	"genres" text[],
	"authors" text[],
	"serialization" text,
	"type" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "mangas_mal_id_unique" UNIQUE("mal_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"quiz_id" integer NOT NULL,
	"score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"xp_earned" integer DEFAULT 0,
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"difficulty" text NOT NULL,
	"questions" jsonb NOT NULL,
	"xp_reward" integer DEFAULT 10,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"username" varchar,
	"bio" text,
	"favorite_quote" text,
	"is_admin" boolean DEFAULT false,
	"level" integer DEFAULT 1,
	"xp" integer DEFAULT 0,
	"is_email_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "anime_episodes" ADD CONSTRAINT "anime_episodes_season_id_anime_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."anime_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_favorites" ADD CONSTRAINT "anime_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_favorites" ADD CONSTRAINT "anime_favorites_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_seasons" ADD CONSTRAINT "anime_seasons_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_watching_progress" ADD CONSTRAINT "anime_watching_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_watching_progress" ADD CONSTRAINT "anime_watching_progress_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_watching_progress" ADD CONSTRAINT "anime_watching_progress_season_id_anime_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."anime_seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_watching_progress" ADD CONSTRAINT "anime_watching_progress_episode_id_anime_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."anime_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_chapters" ADD CONSTRAINT "manga_chapters_manga_id_mangas_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."mangas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_downloads" ADD CONSTRAINT "manga_downloads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_downloads" ADD CONSTRAINT "manga_downloads_chapter_id_manga_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."manga_chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_favorites" ADD CONSTRAINT "manga_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_favorites" ADD CONSTRAINT "manga_favorites_manga_id_mangas_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."mangas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_reading_progress" ADD CONSTRAINT "manga_reading_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_reading_progress" ADD CONSTRAINT "manga_reading_progress_manga_id_mangas_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."mangas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_reading_progress" ADD CONSTRAINT "manga_reading_progress_last_chapter_id_manga_chapters_id_fk" FOREIGN KEY ("last_chapter_id") REFERENCES "public"."manga_chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");