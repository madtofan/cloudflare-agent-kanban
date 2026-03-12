import { Resend } from "resend";
import z from "zod";
import { publicProcedure } from "../index";

export const contactRouter = {
	submit: publicProcedure
		.route({
			method: "POST",
			path: "/api/contact",
			summary: "Submit contact form",
			tags: ["Contact"],
		})
		.input(
			z.object({
				name: z.string().min(1),
				email: z.email(),
				message: z.string().min(1),
			})
		)
		.handler(async ({ input, context }) => {
			const resend = new Resend(context.env.RESEND_API_KEY);

			const result = await resend.emails.send({
				from: "Kanban Contact Form <onboarding@resend.dev>",
				to: [context.env.CONTACT_EMAIL_TO],
				subject: `New Kanban Contact Form Submission from ${input.name}`,
				html: `
					<h2>New Contact Form Submission</h2>
					<p><strong>Name:</strong> ${input.name}</p>
					<p><strong>Email:</strong> ${input.email}</p>
					<p><strong>Message:</strong></p>
					<p>${input.message.replace(/\n/g, "<br>")}</p>
				`,
			});

			if (result.error) {
				throw new Error(result.error.message);
			}

			return { success: true, data: result.data };
		}),
};
