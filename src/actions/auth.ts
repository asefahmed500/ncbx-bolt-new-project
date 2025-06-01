
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

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "User with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "user", // Default role
    });

    await newUser.save();

    return { success: "User registered successfully." };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
