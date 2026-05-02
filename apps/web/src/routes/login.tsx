import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	const [showSignIn, setShowSignIn] = useState(false);
	const navigate = useNavigate();

	return (
		<div className="mx-auto mt-10 flex w-full max-w-md flex-col p-6">
			<Button
				className="self-end"
				onClick={() => navigate({ to: "/" })}
				size="icon"
				variant="ghost"
			>
				<X className="h-4 w-4" />
			</Button>
			{showSignIn ? (
				<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
			) : (
				<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
			)}
		</div>
	);
}
