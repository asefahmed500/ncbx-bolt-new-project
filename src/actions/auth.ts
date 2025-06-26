
"use server";

import dbConnect, { getMongoConnectionState } from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";
import mongoose from 'mongoose';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long.").trim(),
  email: z.string().email("Invalid email address.").trim(),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export async function registerUser(formData: FormData) {
  console.log("[Register Action] Received registration request.");

  const MONGODB_URI_FROM_ENV = process.env.MONGODB_URI;
  if (MONGODB_URI_FROM_ENV) {
    const uriSnippet = `${MONGODB_URI_FROM_ENV.substring(0, 15)}...${MONGODB_URI_FROM_ENV.substring(MONGODB_URI_FROM_ENV.length - 15)}`;
    console.log(`[Register Action] MONGODB_URI from env (snippet): ${uriSnippet}`);
    if (MONGODB_URI_FROM_ENV.includes("YOUR_ACTUAL_DATABASE_NAME_HERE") || MONGODB_URI_FROM_ENV.endsWith("/?retryWrites=true&w=majority&appName=Cluster0")) {
       console.warn("[Register Action] WARNING: MONGODB_URI seems to be missing a database name or using a placeholder.");
    }
  } else {
    console.error("[Register Action] CRITICAL: MONGODB_URI is NOT SET in environment variables!");
    return { error: "Server configuration error: Database URI not set." };
  }

  let normalizedEmail = ""; // Define early for use in catch block

  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = registerSchema.safeParse(data);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      console.warn("[Register Action] Input validation failed:", JSON.stringify(fieldErrors, null, 2));
      return { error: "Invalid input.", details: fieldErrors };
    }

    const { name, email, password } = parsed.data;
    normalizedEmail = email.toLowerCase(); // Normalize email to lowercase
    console.log(`[Register Action] Processing registration for normalized email: ${normalizedEmail}`);

    console.log("[Register Action] Attempting to connect to database...");
    await dbConnect();
    const connectionState = await getMongoConnectionState();
    console.log(`[Register Action] Database connection state before findOne: ${mongoose.ConnectionStates[connectionState]}`);
    if (connectionState !== mongoose.ConnectionStates.connected) {
        console.error("[Register Action] Database not connected before findOne!");
        return { error: "Database connection error. Please try again." };
    }
    console.log("[Register Action] Database connected successfully.");

    console.log(`[Register Action] Checking for existing user with email: ${normalizedEmail}`);
    const existingUser = await User.findOne({ email: normalizedEmail }).lean(); // .lean() for plain JS object

    if (existingUser) {
      console.warn(`[Register Action] RESULT: User.findOne FOUND an existing user for email ${normalizedEmail}. User details:`, JSON.stringify(existingUser, null, 2));
      return { error: "User with this email already exists." };
    } else {
      console.log(`[Register Action] RESULT: User.findOne did NOT find user with email ${normalizedEmail}. Proceeding to create new user.`);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`[Register Action] Password hashed for ${normalizedEmail}.`);

    const newUser = new User({
      name,
      email: normalizedEmail, // Save the normalized email
      password: hashedPassword,
      role: "user", // Default role for new registrations
    });

    console.log(`[Register Action] Attempting to save new user ${normalizedEmail} with data:`, JSON.stringify(newUser.toObject(), null, 2));
    await newUser.save();
    console.log(`[Register Action] User ${normalizedEmail} registered and saved successfully. User ID: ${newUser._id}`);

    return { success: "User registered successfully." };

  } catch (error: any) { 
    console.error(`[Register Action] CRITICAL: An error occurred during the registration process for ${normalizedEmail || 'unknown email'}.`);
    console.error("[Register Action] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

    if (error.code === 11000) { // MongoDB E11000 duplicate key error code
      console.warn("[Register Action] MongoDB E11000 duplicate key error detected during save operation.");
      // Check if the duplicate key error is specifically for the 'email' field
      const isEmailDuplicateInError = error.keyValue && typeof error.keyValue.email !== 'undefined' && error.keyValue.email === normalizedEmail;

      if (isEmailDuplicateInError) {
        console.warn(`[Register Action] Confirmed E11000 error is for the email being registered: ${normalizedEmail}`);
        return { error: "User with this email already exists (caught by database unique index)." };
      } else {
        console.error("[Register Action] E11000 error detected, but not for the current email OR keyValue.email is missing/different. Offending key:", error.keyValue);
        return { error: "A unique data constraint was violated during registration. Please check your input." };
      }
    }
    
    if (error instanceof mongoose.Error.ValidationError) {
      console.warn("[Register Action] Mongoose validation error:", JSON.stringify(error.errors, null, 2));
      const messages = Object.values(error.errors).map(err => err.message).join(' ');
      return { error: `Validation failed: ${messages}` };
    }

    if (error.message && error.message.includes('querySrv ENODATA') || (error.message && error.message.includes('querySrv ESERVFAIL'))) {
        console.error("[Register Action] HINT: 'ENODATA' or 'ESERVFAIL' often indicates a DNS resolution issue with the Atlas hostname, or that the cluster is paused/deleted, or IP access list issues.");
         return { error: "Database connection failed (DNS or cluster availability). Please try again later." };
    }
    if (error.message && error.message.includes('bad auth') || (error.message && error.message.includes('Authentication failed'))) {
        console.error("[Register Action] HINT: 'bad auth' or 'Authentication failed' indicates incorrect username/password in MONGODB_URI or the user doesn't have permissions for the target database.");
        return { error: "Database authentication failed. Please check server configuration." };
    }
    
    console.error("[Register Action] An unexpected, non-E11000, non-validation error occurred:", error.message);
    return { error: "An unexpected error occurred during registration. Please try again later." };
  }
}

    