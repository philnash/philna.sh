import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { Resend } from "resend";
import { RESEND_API_KEY, RESEND_SEGMENT_ID } from "astro:env/server";

const resend = new Resend(RESEND_API_KEY);

export const subscribe = defineAction({
  input: z.object({
    email: z.email("Please enter a valid email address."),
  }), handler: async ({ email }) => {
    try {
      await resend.contacts.create({
        email,
        segments: [{ id: RESEND_SEGMENT_ID }],
      });
      return { success: true };
    } catch (error) {
      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: "There was an issue subscribing to this blog. Please try again later.",
      })
    }
  }
});