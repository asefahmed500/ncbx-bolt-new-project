
import mongoose, { type ConnectionStates } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[dbConnect] CRITICAL: MONGODB_URI is not defined in .env');
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}
if (MONGODB_URI.includes("YOUR_ACTUAL_DATABASE_NAME_HERE")) {
  console.error('[dbConnect] CRITICAL: MONGODB_URI contains placeholder "YOUR_ACTUAL_DATABASE_NAME_HERE". Please set a real database name.');
  // Potentially throw an error here too, or let subsequent connection fail
}


interface CachedMongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: CachedMongooseConnection;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log('[dbConnect] Using cached database connection.');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable command buffering if connection is slow to establish
      // serverSelectionTimeoutMS: 5000, // Optional: Shorter timeout for server selection
    };
    console.log('[dbConnect] Creating new database connection promise.');
    const uriSnippet = MONGODB_URI.length > 30 ? `${MONGODB_URI.substring(0, 15)}...${MONGODB_URI.substring(MONGODB_URI.length - 15)}` : MONGODB_URI;
    console.log(`[dbConnect] Attempting to connect to: ${uriSnippet}`);

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('[dbConnect] MongoDB connection successful via promise.');
      return mongooseInstance;
    }).catch(err => {
      console.error('[dbConnect] MongoDB connection error via promise:', err.message);
      cached.promise = null; // Reset promise on error
      throw err; // Re-throw error
    });
  }

  try {
    console.log('[dbConnect] Awaiting database connection promise.');
    cached.conn = await cached.promise;
    console.log('[dbConnect] Database connection promise resolved.');
  } catch (e: any) {
    console.error('[dbConnect] Error resolving database connection promise:', e.message);
    cached.promise = null; // Ensure promise is cleared on error so it can be retried
    throw e;
  }

  return cached.conn;
}

export async function getMongoConnectionState(): Promise<ConnectionStates> {
    // This will attempt to connect if not already connected.
    // Catch errors here to avoid unhandled promise rejections if dbConnect throws.
    try {
      await dbConnect();
      return mongoose.connection.readyState;
    } catch (error) {
      console.error("[getMongoConnectionState] Error ensuring DB connection for state check:", error);
      return mongoose.connection.readyState; // Return current state even if connect attempt failed
    }
}

export default dbConnect;
