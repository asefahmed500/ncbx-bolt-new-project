
"use server";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export async function registerUser(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = registerSchema.safeParse(data);

    if (!parsed.success) {
      return { error: "Invalid input.", details: parsed.error.flatten().fieldErrors };
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase(); // Normalize email to lowercase

    await dbConnect();

    console.log(`[Register Action] Attempting to register with email: ${normalizedEmail}`);

    // Check for existing user with the normalized email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.warn(`[Register Action] User with email ${normalizedEmail} already exists (found by findOne). User ID: ${existingUser._id}`);
      return { error: "User with this email already exists." };
    }

    console.log(`[Register Action] Email ${normalizedEmail} is not found by findOne. Proceeding to create new user.`);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: normalizedEmail, // Save the normalized email
      password: hashedPassword,
      role: "user", // Default role
    });

    await newUser.save();
    console.log(`[Register Action] User ${normalizedEmail} registered successfully. User ID: ${newUser._id}`);

    return { success: "User registered successfully." };
  } catch (error: any) { // Explicitly type error as any for easier property access
    console.error("[Register Action] Registration process failed. Full error object:", JSON.stringify(error, null, 2));

    if (error.code === 11000) { // MongoDB E11000 duplicate key error code
      console.warn("[Register Action] MongoDB E11000 duplicate key error detected.");
      console.warn(`[Register Action] Duplicate key error details: keyValue=${JSON.stringify(error.keyValue)}, message=${error.message}`);

      // Check if the duplicate key error is specifically for the email field
      const isEmailDuplicateError = 
        (error.keyPattern && typeof error.keyPattern.email !== 'undefined') || 
        (error.keyValue && typeof error.keyValue.email !== 'undefined') ||
        (error.message && error.message.toLowerCase().includes("email_1") && error.message.toLowerCase().includes("duplicate key")); // 'email_1' is a common default index name for email

      if (isEmailDuplicateError) {
        console.warn(`[Register Action] Confirmed E11000 error is for email: ${error.keyValue?.email || normalizedEmail}`);
        return { error: "User with this email already exists." };
      } else {
        console.error("[Register Action] E11000 error detected, but not conclusively on the email field based on keyPattern or keyValue.email. Offending key:", error.keyValue);
        return { error: "A unique data constraint was violated. Please check your input or contact support if the issue persists." };
      }
    }
    
    console.error("[Register Action] An unexpected, non-E11000 error occurred:", error.message);
    return { error: "An unexpected error occurred during registration. Please try again later." };
  }
}

