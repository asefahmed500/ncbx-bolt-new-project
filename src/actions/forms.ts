
"use server";

import { z } from "zod";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address."),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required."),
});

export async function handleContactFormSubmit(formData: FormData) {
  try {
    const parsedData = contactFormSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    });

    if (!parsedData.success) {
      console.error("Contact Form Validation Error:", parsedData.error.flatten());
      return { success: false, error: "Invalid form data provided." };
    }

    const { name, email, subject, message } = parsedData.data;
    
    // In a real application, you would send an email or save this to a database.
    // For this example, we will just log it to the server console.
    console.log("--- New Contact Form Submission ---");
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Subject:", subject);
    console.log("Message:", message);
    console.log("-----------------------------------");

    return { success: true, message: "Thank you for your message! We will get back to you shortly." };
  } catch (error) {
    console.error("Error handling contact form:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}


const newsletterFormSchema = z.object({
  email: z.string().email("Invalid email address."),
});

export async function handleNewsletterSignup(formData: FormData) {
    try {
        const parsedData = newsletterFormSchema.safeParse({
            email: formData.get('email'),
        });

        if (!parsedData.success) {
            return { success: false, error: "Please provide a valid email address." };
        }

        const { email } = parsedData.data;

        // In a real application, you'd add this email to your mailing list (e.g., Mailchimp, ConvertKit).
        // For this example, we'll just log it.
        console.log(`--- New Newsletter Signup: ${email} ---`);

        return { success: true, message: "Thanks for subscribing!" };

    } catch (error) {
        console.error("Error handling newsletter signup:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}
