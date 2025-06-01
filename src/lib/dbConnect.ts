
import mongoose, { type ConnectionStates } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[dbConnect] CRITICAL: MONGODB_URI is not defined in .env');
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}
if (MONGODB_URI.includes("YOUR_ACTUAL_DATABASE_NAME_HERE") || MONGODB_URI.endsWith("/?retryWrites=true&w=majority&appName=Cluster0")) {
  console.error('[dbConnect] CRITICAL: MONGODB_URI contains placeholder "YOUR_ACTUAL_DATABASE_NAME_HERE" or is missing the database name. Please set a real database name in the URI (e.g., mongodb+srv://user:pass@cluster.mongodb.net/YOUR_DB_NAME?retryWrites=true...).');
  // Not throwing here to allow NextAuth to attempt connection and potentially log more specific errors
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
    const currentState = mongoose.connection.readyState;
    console.log(`[dbConnect] Using cached database connection. Current state: ${mongoose.ConnectionStates[currentState]}`);
    if (currentState === mongoose.ConnectionStates.connected) {
        return cached.conn;
    }
    // If cached.conn exists but state is not connected, something is wrong. Try to reconnect.
    console.warn('[dbConnect] Cached connection exists but is not in connected state. Attempting to clear cache and reconnect.');
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, 
      // serverSelectionTimeoutMS: 5000, 
    };
    console.log('[dbConnect] Creating new database connection promise.');
    const uriSnippet = MONGODB_URI.length > 30 ? `${MONGODB_URI.substring(0, 15)}...${MONGODB_URI.substring(MONGODB_URI.length - 15)}` : MONGODB_URI;
    console.log(`[dbConnect] Attempting to connect to: ${uriSnippet}`);

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('[dbConnect] MongoDB connection successful via promise.');
      return mongooseInstance;
    }).catch(err => {
      console.error('[dbConnect] MongoDB connection error via promise. Error object raw:', err);
      if (err instanceof Error) {
        console.error('[dbConnect] Error name:', err.name);
        console.error('[dbConnect] Error message:', err.message);
        console.error('[dbConnect] Error stack:', err.stack);
      }
      cached.promise = null; 
      throw err; 
    });
  }

  try {
    console.log('[dbConnect] Awaiting database connection promise.');
    cached.conn = await cached.promise;
    console.log(`[dbConnect] Database connection promise resolved. State: ${mongoose.ConnectionStates[mongoose.connection.readyState]}`);
  } catch (e: any) {
    console.error('[dbConnect] Error resolving database connection promise. Error object raw:', e);
    if (e instanceof Error) {
        console.error('[dbConnect] Resolving Promise Error name:', e.name);
        console.error('[dbConnect] Resolving Promise Error message:', e.message);
        console.error('[dbConnect] Resolving Promise Error stack:', e.stack);
    }
    cached.promise = null; 
    throw e;
  }

  return cached.conn;
}

export async function getMongoConnectionState(): Promise<ConnectionStates> {
    try {
      await dbConnect(); // Ensures connection attempt before checking state
      return mongoose.connection.readyState;
    } catch (error) {
      console.error("[getMongoConnectionState] Error ensuring DB connection for state check. Error object raw:", error);
      return mongoose.connection.readyState; // Return current state even if connect attempt failed
    }
}

export default dbConnect;
