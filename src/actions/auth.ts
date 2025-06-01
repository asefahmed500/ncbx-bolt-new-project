
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

    // Check for existing user with the normalized email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return { error: "User with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: normalizedEmail, // Save the normalized email
      password: hashedPassword,
      role: "user", // Default role
    });

    await newUser.save();

    return { success: "User registered successfully." };
  } catch (error) {
    console.error("Registration error:", error);
    // Check for MongoDB unique constraint error (E11000)
    if ((error as any).code === 11000 && (error as any).keyPattern?.email) {
        return { error: "User with this email already exists." };
    }
    return { error: "An unexpected error occurred. Please try again." };
  }
}
