import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orpc } from "@/utils/orpc";

function ContactSection() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		message: "",
	});

	const submitContact = useMutation(
		orpc.contact.submit.mutationOptions({
			onSuccess: () => {
				toast.success("Thanks for reaching out! We'll get back to you soon.");
				setFormData({ name: "", email: "", message: "" });
			},
			onError: () => {
				toast.error("Failed to send message. Please try again.");
			},
		})
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		submitContact.mutate({
			name: formData.name,
			email: formData.email,
			message: formData.message,
		});
	};

	return (
		<div className="mx-auto max-w-xl">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Get In Touch</CardTitle>
					<CardDescription>
						Interested in this project? We'd love to hear from you.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Your name"
								required
								value={formData.name}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								placeholder="your@email.com"
								required
								type="email"
								value={formData.email}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="message">Message</Label>
							<textarea
								className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								id="message"
								onChange={(e) =>
									setFormData({ ...formData, message: e.target.value })
								}
								placeholder="Tell us about your interest in this project..."
								required
								value={formData.message}
							/>
						</div>
						<Button
							className="w-full"
							disabled={submitContact.isPending}
							type="submit"
						>
							{submitContact.isPending ? "Sending..." : "Send Message"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

export default ContactSection;
