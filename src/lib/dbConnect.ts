
import mongoose, { type ConnectionStates } from 'mongoose';

const MONGODB_URI_FROM_ENV = process.env.MONGODB_URI;

// These initial checks should only happen on the server.
// If process.env.MONGODB_URI is accessed on the client, it will be undefined
// (unless explicitly exposed via NEXT_PUBLIC_).
// This guard prevents the error from being thrown if dbConnect.ts is mistakenly bundled for the client.
if (typeof window === 'undefined') {
  if (!MONGODB_URI_FROM_ENV) {
    console.error('[dbConnect] CRITICAL: MONGODB_URI is not defined in .env. Please ensure it is set.');
    // This throw should only happen on the server
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env'
    );
  }

  // Check if the MONGODB_URI contains the placeholder or is missing a database name.
  if (MONGODB_URI_FROM_ENV.includes("YOUR_ACTUAL_DATABASE_NAME_HERE") || MONGODB_URI_FROM_ENV.endsWith("/?retryWrites=true&w=majority") || MONGODB_URI_FROM_ENV.endsWith("/?retryWrites=true&w=majority&appName=Cluster0")) {
    console.warn(`[dbConnect] WARNING: Your MONGODB_URI ("${MONGODB_URI_FROM_ENV.substring(0,30)}...") might be missing a specific database name or using a placeholder. It should typically look like 'mongodb+srv://user:pass@cluster.mongodb.net/YOUR_DB_NAME?retryWrites=true...'. Without a specific database name, Mongoose might use a default 'test' database or fail.`);
  }
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
  if (typeof window === 'undefined') { // Log only on server
    console.log('[dbConnect] Initialized global mongoose cache.');
  }
}

async function dbConnect(): Promise<typeof mongoose> {
  // Use the already captured MONGODB_URI_FROM_ENV to ensure consistency within this module's scope for dbConnect calls
  const MONGODB_URI_FOR_CONNECT = MONGODB_URI_FROM_ENV; 

  if (typeof window !== 'undefined') {
    // This function should absolutely not be called on the client.
    // If it is, log an error and prevent mongoose.connect from attempting with an undefined URI.
    console.error("[dbConnect] CRITICAL: dbConnect() was called on the client-side. This should not happen.");
    throw new Error("dbConnect cannot be called from the client-side.");
  }

  if (!MONGODB_URI_FOR_CONNECT) {
    // This check is now redundant if the top-level server-side check passed,
    // but good for safety if dbConnect is called in an unexpected server context where env vars might change.
    console.error('[dbConnect] CRITICAL: MONGODB_URI is somehow undefined at connect time within dbConnect().');
    throw new Error('MONGODB_URI is not available for connection.');
  }
  
  if (cached.conn) {
    const currentState = mongoose.connection.readyState;
    console.log(`[dbConnect] Using cached database connection. Current state: ${mongoose.ConnectionStates[currentState]}.`);
    if (currentState === mongoose.ConnectionStates.connected) {
        return cached.conn;
    }
    console.warn('[dbConnect] Cached connection exists but is not in connected state. Will attempt to clear cache and reconnect.');
    cached.conn = null; 
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, 
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
        cached.promise = null; 
        throw err; 
      });
  }

  try {
    console.log('[dbConnect] Awaiting database connection promise resolution...');
    cached.conn = await cached.promise;
    const finalState = mongoose.connection.readyState;
    console.log(`[dbConnect] Database connection promise resolved. Final state: ${mongoose.ConnectionStates[finalState]}.`);
    if (finalState !== mongoose.ConnectionStates.connected) {
      console.error(`[dbConnect] CRITICAL: Connection promise resolved but final state is ${mongoose.ConnectionStates[finalState]}. This is unexpected.`);
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
    cached.promise = null; 
    throw e; 
  }

  return cached.conn;
}

export async function getMongoConnectionState(): Promise<ConnectionStates> {
    if (typeof window !== 'undefined') {
      console.warn("[getMongoConnectionState] Called on client. MongoDB state is only relevant on server. Returning 'disconnected'.");
      return mongoose.ConnectionStates.disconnected;
    }
    try {
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
