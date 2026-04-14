import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 8080,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  adminRegistrationKey: process.env.ADMIN_REGISTRATION_KEY || "",
  imagekitPublicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  imagekitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  imagekitUrlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
};

const requiredKeys = ["databaseUrl", "jwtAccessSecret", "jwtRefreshSecret"];

for (const key of requiredKeys) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable for: ${key}`);
  }
}
