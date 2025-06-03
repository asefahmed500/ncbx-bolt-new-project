
import mongoose, { type ConnectionStates } from 'mongoose';

const MONGODB_URI_FROM_ENV = process.env.MONGODB_URI;

// These initial checks should only happen on the server.
if (typeof window === 'undefined') {
  if (!MONGODB_URI_FROM_ENV) {
    console.error('[dbConnect] CRITICAL: MONGODB_URI is not defined in .env. Please ensure it is set. The application will likely fail to connect to the database.');
  }

  if (MONGODB_URI_FROM_ENV && (MONGODB_URI_FROM_ENV.includes("YOUR_ACTUAL_DATABASE_NAME_HERE") || MONGODB_URI_FROM_ENV.endsWith("/?retryWrites=true&w=majority") || MONGODB_URI_FROM_ENV.endsWith("/?retryWrites=true&w=majority&appName=Cluster0"))) {
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
  const MONGODB_URI_FOR_CONNECT = MONGODB_URI_FROM_ENV;

  if (typeof window !== 'undefined') {
    console.error("[dbConnect] CRITICAL: dbConnect() was called on the client-side. This should not happen.");
    throw new Error("dbConnect cannot be called from the client-side.");
  }

  if (!MONGODB_URI_FOR_CONNECT) {
    console.error('[dbConnect] CRITICAL: MONGODB_URI is not available for connection at connect time (it was not defined in .env). Database operations will fail.');
    throw new Error('MONGODB_URI is not available for connection. Please check server environment configuration and ensure the .env file is loaded.');
  }

  if (cached.conn) {
    const currentState = mongoose.connection.readyState;
    if (currentState === mongoose.ConnectionStates.connected) {
        return cached.conn;
    }
    console.warn(`[dbConnect] Cached connection exists but is not in connected state (${mongoose.ConnectionStates[currentState]}). Will attempt to clear cache and reconnect.`);
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    const uriSnippet = MONGODB_URI_FOR_CONNECT.length > 30 ? `${MONGODB_URI_FOR_CONNECT.substring(0, 15)}...${MONGODB_URI_FOR_CONNECT.substring(MONGODB_URI_FOR_CONNECT.length - 15)}` : MONGODB_URI_FOR_CONNECT;
    console.log(`[dbConnect] No existing promise or stale connection. Creating new database connection promise to: ${uriSnippet}`);

    cached.promise = mongoose.connect(MONGODB_URI_FOR_CONNECT, opts)
      .then((mongooseInstance) => {
        console.log('[dbConnect] MongoDB connection successful via new promise.');
        return mongooseInstance;
      })
      .catch(err => {
        console.error('[dbConnect] CRITICAL: MongoDB connection error during initial connect via promise.');
        console.error("[dbConnect] Error Name:", err?.name);
        console.error("[dbConnect] Error Message:", err?.message);

        if (err?.message?.includes('querySrv ENODATA') || err?.message?.includes('querySrv ESERVFAIL')) {
            console.error("[dbConnect] HINT: 'ENODATA' or 'ESERVFAIL' often indicates a DNS resolution issue with the Atlas hostname, that the cluster is paused/deleted, or IP access list misconfiguration.");
        } else if (err?.message?.includes('bad auth') || err?.message?.includes('Authentication failed')) {
            console.error("[dbConnect] HINT: 'bad auth' or 'Authentication failed' indicates incorrect username/password in MONGODB_URI or the user doesn't have permissions for the target database.");
        } else if (err?.name === 'MongoNetworkError' || err?.name === 'MongoServerSelectionError') {
             console.error("[dbConnect] HINT: This is a network-related error. Check firewall settings, internet connectivity of the server, and if the MongoDB server/cluster is reachable from your application's environment.");
        }
        cached.promise = null;
        const detailedMessage = `MongoDB connection failed. Original error: ${err.message}.
        1. Verify MONGODB_URI in your .env file is correct (e.g., mongodb+srv://user:pass@cluster.host/dbname?retryWrites=true&w=majority).
        2. Ensure your MongoDB server is running and accessible from your application server.
        3. Check IP whitelists if using MongoDB Atlas.
        4. Review the full server logs for more specific Mongoose error details and hints printed above this message.`;
        throw new Error(detailedMessage);
      });
  }

  try {
    cached.conn = await cached.promise;
    const finalState = mongoose.connection.readyState;
    if (finalState !== mongoose.ConnectionStates.connected) {
      console.error(`[dbConnect] CRITICAL: Connection promise resolved but final state is ${mongoose.ConnectionStates[finalState]}. This is unexpected.`);
      cached.conn = null;
      cached.promise = null;
      throw new Error(`Database connection failed. Final state: ${mongoose.ConnectionStates[finalState]}`);
    }
  } catch (e: any) {
    console.error('[dbConnect] CRITICAL: Error while resolving database connection promise (await cached.promise).');
    cached.promise = null;
    // If e is already the detailed error from the catch block above, re-throwing it is fine.
    // Otherwise, ensure the error message is helpful.
    if (e.message.startsWith('MongoDB connection failed')) {
        throw e;
    } else {
        throw new Error(`Failed to resolve MongoDB connection: ${e.message}. Check server logs and MONGODB_URI.`);
    }
  }

  return cached.conn;
}

export async function getMongoConnectionState(): Promise<ConnectionStates> {
    if (typeof window !== 'undefined') {
      console.warn("[getMongoConnectionState] Called on client. MongoDB state is only relevant on server. Returning 'disconnected'.");
      return mongoose.ConnectionStates.disconnected;
    }
    try {
      return mongoose.connection.readyState;
    } catch (error: any) {
      console.warn("[getMongoConnectionState] Error accessing mongoose.connection.readyState. Error:", error.message);
      return mongoose.ConnectionStates.disconnected;
    }
}

export default dbConnect;
