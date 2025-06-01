
"use server";

import dbConnect, { getMongoConnectionState } from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";
import mongoose from 'mongoose';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export async function registerUser(formData: FormData) {
  console.log("[Register Action] Received registration request.");

  const MONGODB_URI_FROM_ENV = process.env.MONGODB_URI;
  if (MONGODB_URI_FROM_ENV) {
    const uriSnippet = `${MONGODB_URI_FROM_ENV.substring(0, 15)}...${MONGODB_URI_FROM_ENV.substring(MONGODB_URI_FROM_ENV.length - 15)}`;
    console.log(`[Register Action] MONGODB_URI from env (snippet): ${uriSnippet}`);
  } else {
    console.error("[Register Action] MONGODB_URI is NOT SET in environment variables!");
    return { error: "Server configuration error: Database URI not set." };
  }

  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = registerSchema.safeParse(data);

    if (!parsed.success) {
      console.warn("[Register Action] Input validation failed:", parsed.error.flatten().fieldErrors);
      return { error: "Invalid input.", details: parsed.error.flatten().fieldErrors };
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase(); // Normalize email to lowercase
    console.log(`[Register Action] Normalized email for registration: ${normalizedEmail}`);

    console.log("[Register Action] Attempting to connect to database...");
    await dbConnect();
    const connectionState = await getMongoConnectionState();
    console.log(`[Register Action] Database connection state: ${mongoose.ConnectionStates[connectionState]}`);
    if (connectionState !== mongoose.ConnectionStates.connected) {
        console.error("[Register Action] Database not connected!");
        return { error: "Database connection error. Please try again." };
    }
    console.log("[Register Action] Database connected successfully.");


    console.log(`[Register Action] Checking for existing user with email: ${normalizedEmail}`);
    // Using .lean() returns a plain JS object, which can sometimes simplify things, though unlikely the cause here.
    const existingUser = await User.findOne({ email: normalizedEmail }).lean(); 

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
      role: "user", // Default role
    });

    console.log(`[Register Action] Attempting to save new user ${normalizedEmail}...`);
    await newUser.save();
    console.log(`[Register Action] User ${normalizedEmail} registered and saved successfully. User ID: ${newUser._id}`);

    return { success: "User registered successfully." };

  } catch (error: any) { 
    console.error("[Register Action] CRITICAL: An error occurred during the registration process. Full error object:", JSON.stringify(error, null, 2));

    if (error.code === 11000) { // MongoDB E11000 duplicate key error code
      console.warn("[Register Action] MongoDB E11000 duplicate key error detected during save operation.");
      console.warn(`[Register Action] Duplicate key error details: keyValue=${JSON.stringify(error.keyValue)}, message=${error.message}`);
      
      const isEmailDuplicateInError = error.keyValue && typeof error.keyValue.email !== 'undefined' && error.keyValue.email === normalizedEmail;

      if (isEmailDuplicateInError) {
        console.warn(`[Register Action] Confirmed E11000 error is for the email being registered: ${normalizedEmail}`);
        return { error: "User with this email already exists." };
      } else {
        console.error("[Register Action] E11000 error detected, but not for the current email OR keyValue.email is missing/different. Offending key:", error.keyValue);
        return { error: "A unique data constraint was violated. Please check your input." };
      }
    }
    
    console.error("[Register Action] An unexpected, non-E11000 error occurred:", error.message);
    return { error: "An unexpected error occurred during registration. Please try again later." };
  }
}
