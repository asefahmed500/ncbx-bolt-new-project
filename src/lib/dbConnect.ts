
import mongoose, { type ConnectionStates } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[dbConnect] CRITICAL: MONGODB_URI is not defined in .env. Please ensure it is set.');
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}

// Check if the MONGODB_URI contains the placeholder or is missing a database name.
// A typical valid Atlas URI with a DB name looks like: mongodb+srv://user:pass@cluster.mongodb.net/YOUR_DB_NAME?retryWrites=true...
// A URI missing the DB name might look like: mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true...
if (MONGODB_URI.includes("YOUR_ACTUAL_DATABASE_NAME_HERE") || MONGODB_URI.endsWith("/?retryWrites=true&w=majority") || MONGODB_URI.endsWith("/?retryWrites=true&w=majority&appName=Cluster0")) {
  console.warn(`[dbConnect] WARNING: Your MONGODB_URI ("${MONGODB_URI.substring(0,30)}...") might be missing a specific database name or using a placeholder. It should typically look like 'mongodb+srv://user:pass@cluster.mongodb.net/YOUR_DB_NAME?retryWrites=true...'. Without a specific database name, Mongoose might use a default 'test' database or fail.`);
}


interface CachedMongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS.Global interface to include the mongoose property
declare global {
  // eslint-disable-next-line no-var
  var mongoose: CachedMongooseConnection;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
  console.log('[dbConnect] Initialized global mongoose cache.');
}

async function dbConnect(): Promise<typeof mongoose> {
  const MONGODB_URI_FOR_CONNECT = process.env.MONGODB_URI; // Re-check env var in case it changes (though unlikely for a single server lifecycle)

  if (!MONGODB_URI_FOR_CONNECT) {
    console.error('[dbConnect] CRITICAL: MONGODB_URI is somehow undefined at connect time. This should not happen.');
    throw new Error('MONGODB_URI is not available.');
  }
  
  if (cached.conn) {
    const currentState = mongoose.connection.readyState;
    console.log(`[dbConnect] Using cached database connection. Current state: ${mongoose.ConnectionStates[currentState]}.`);
    if (currentState === mongoose.ConnectionStates.connected) {
        return cached.conn;
    }
    console.warn('[dbConnect] Cached connection exists but is not in connected state. Will attempt to clear cache and reconnect.');
    cached.conn = null; // Force re-evaluation
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose's buffering. Good for more immediate error feedback.
      // serverSelectionTimeoutMS: 5000, // Timeout for server selection, might be useful for debugging connection issues.
    };
    const uriSnippet = MONGODB_URI_FOR_CONNECT.length > 30 ? `${MONGODB_URI_FOR_CONNECT.substring(0, 15)}...${MONGODB_URI_FOR_CONNECT.substring(MONGODB_URI_FOR_CONNECT.length - 15)}` : MONGODB_URI_FOR_CONNECT;
    console.log(`[dbConnect] No existing promise. Creating new database connection promise to: ${uriSnippet}`);

    cached.promise = mongoose.connect(MONGODB_URI_FOR_CONNECT, opts)
      .then((mongooseInstance) => {
        console.log('[dbConnect] MongoDB connection successful via new promise.');
        return mongooseInstance;
      })
      .catch(err => {
        console.error('[dbConnect] CRITICAL: MongoDB connection error during initial connect via promise.');
        console.error("[dbConnect] Error object raw:", err);
        if (err instanceof Error) {
            console.error("[dbConnect] Error name:", err.name);
            console.error("[dbConnect] Error message:", err.message);
            if (err.message.includes('querySrv ENODATA') || err.message.includes('querySrv ESERVFAIL')) {
                console.error("[dbConnect] HINT: 'ENODATA' or 'ESERVFAIL' often indicates a DNS resolution issue with the Atlas hostname, or that the cluster is paused/deleted, or IP access list issues.");
            }
            if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
                console.error("[dbConnect] HINT: 'bad auth' or 'Authentication failed' indicates incorrect username/password in MONGODB_URI or the user doesn't have permissions for the target database.");
            }
        }
        cached.promise = null; // Clear the promise on error so retry can happen
        throw err; // Re-throw the error to be caught by the caller
      });
  }

  try {
    console.log('[dbConnect] Awaiting database connection promise resolution...');
    cached.conn = await cached.promise;
    const finalState = mongoose.connection.readyState;
    console.log(`[dbConnect] Database connection promise resolved. Final state: ${mongoose.ConnectionStates[finalState]}.`);
    if (finalState !== mongoose.ConnectionStates.connected) {
      console.error(`[dbConnect] CRITICAL: Connection promise resolved but final state is ${mongoose.ConnectionStates[finalState]}. This is unexpected.`);
      // Potentially throw an error here or clear cache to force full reconnect on next attempt
      cached.conn = null;
      cached.promise = null;
      throw new Error(`Database connection failed. State: ${mongoose.ConnectionStates[finalState]}`);
    }
  } catch (e: any) {
    console.error('[dbConnect] CRITICAL: Error while resolving database connection promise.');
    console.error("[dbConnect] Resolving Promise Error object raw:", e);
    if (e instanceof Error) {
        console.error("[dbConnect] Resolving Promise Error name:", e.name);
        console.error("[dbConnect] Resolving Promise Error message:", e.message);
    }
    cached.promise = null; // Clear promise on error
    throw e; // Re-throw to be caught by caller
  }

  return cached.conn;
}

export async function getMongoConnectionState(): Promise<ConnectionStates> {
    // This function primarily exists for external checks, dbConnect itself handles connection.
    try {
      // Attempt connection if not already connected, but don't throw if it fails here,
      // just return the current state. The main operations will handle connection errors.
      if (mongoose.connection.readyState !== mongoose.ConnectionStates.connected) {
        await dbConnect().catch(() => { /* ignore error here, just want state */ });
      }
      return mongoose.connection.readyState;
    } catch (error) {
      console.warn("[getMongoConnectionState] Error during state check, returning current readyState. Error:", error);
      return mongoose.connection.readyState; 
    }
}

export default dbConnect;
