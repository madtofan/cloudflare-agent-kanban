import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { orpc } from "@/utils/orpc";
import {
	generateSettingsParams,
	useBreadcrumb,
} from "@/components/ui/breadcrumb";

const EXPIRY_OPTIONS = [
	{ label: "Never", value: "null" },
	{ label: "7 days", value: "7" },
	{ label: "30 days", value: "30" },
	{ label: "90 days", value: "90" },
	{ label: "1 year", value: "365" },
] as const;

function ExpiryBadge({ expiresAt }: { expiresAt: Date | string | null }) {
	if (!expiresAt) {
		return <Badge variant="secondary">Never</Badge>;
	}
	if (new Date(expiresAt) > new Date()) {
		return (
			<Badge variant="outline">
				{new Date(expiresAt).toLocaleDateString()}
			</Badge>
		);
	}
	return <Badge variant="destructive">Expired</Badge>;
}

function SettingsPage() {
	const queryClient_ = useQueryClient();

	const { data: projects } = useQuery(orpc.project.getAll.queryOptions());
	const { data: tokens, isLoading } = useQuery(
		orpc.token.listTokens.queryOptions(),
	);

	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [newTokenName, setNewTokenName] = useState("");
	const [selectedProjectId, setSelectedProjectId] = useState("");
	const [selectedExpiry, setSelectedExpiry] = useState("null");
	const [createdToken, setCreatedToken] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const { addBreadcrumb } = useBreadcrumb();

	useEffect(() => {
		addBreadcrumb(...generateSettingsParams());
	}, [addBreadcrumb]);

	const createMutation = useMutation(
		orpc.token.createToken.mutationOptions({
			onSuccess: (data) => {
				setCreatedToken(data.token);
				queryClient_.invalidateQueries({
					queryKey: orpc.token.listTokens.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const revokeMutation = useMutation(
		orpc.token.revokeToken.mutationOptions({
			onSuccess: () => {
				queryClient_.invalidateQueries({
					queryKey: orpc.token.listTokens.queryKey(),
				});
				toast.success("Token revoked");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const handleCreate = useCallback(() => {
		if (!newTokenName.trim()) {
			toast.error("Token name is required");
			return;
		}
		if (!selectedProjectId) {
			toast.error("Please select a project");
			return;
		}
		createMutation.mutate({
			name: newTokenName.trim(),
			projectId: selectedProjectId,
			expiresInDays: selectedExpiry === "null" ? null : Number(selectedExpiry),
		});
	}, [newTokenName, selectedProjectId, selectedExpiry, createMutation]);

	const handleCopyToken = useCallback(async () => {
		if (createdToken) {
			await navigator.clipboard.writeText(createdToken);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [createdToken]);

	let content: ReactNode;
	if (isLoading) {
		content = (
			<div className="flex justify-center py-8">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		);
	} else if (tokens?.length) {
		content = (
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Token</TableHead>
						<TableHead>Project</TableHead>
						<TableHead>Expires</TableHead>
						<TableHead>Last Used</TableHead>
						<TableHead>Created</TableHead>
						<TableHead />
					</TableRow>
				</TableHeader>
				<TableBody>
					{tokens.map((token) => (
						<TableRow key={token.id}>
							<TableCell className="font-medium">{token.name}</TableCell>
							<TableCell>
								<code className="rounded bg-muted px-2 py-0.5 text-xs">
									{token.partialToken}
								</code>
							</TableCell>
							<TableCell>{token.project.name}</TableCell>
							<TableCell>
								<ExpiryBadge expiresAt={token.expiresAt} />
							</TableCell>
							<TableCell className="text-muted-foreground text-sm">
								{token.lastUsedAt
									? new Date(token.lastUsedAt).toLocaleDateString()
									: "Never"}
							</TableCell>
							<TableCell className="text-muted-foreground text-sm">
								{new Date(token.createdAt).toLocaleDateString()}
							</TableCell>
							<TableCell>
								<Button
									onClick={() => revokeMutation.mutate({ tokenId: token.id })}
									size="icon"
									variant="ghost"
								>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		);
	} else {
		content = (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<KeyRound className="mb-2 h-8 w-8 text-muted-foreground" />
				<p className="text-muted-foreground">
					No API tokens yet. Generate one to connect your AI agent.
				</p>
			</div>
		);
	}

	const handleCloseDialog = useCallback(() => {
		setShowCreateDialog(false);
		setNewTokenName("");
		setSelectedProjectId("");
		setSelectedExpiry("null");
		setCreatedToken(null);
		setCopied(false);
	}, []);

	return (
		<div className="container mx-auto p-10">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Settings</h1>
					<p className="text-muted-foreground">
						Manage your API tokens for MCP access
					</p>
				</div>
				<Button onClick={() => setShowCreateDialog(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Generate Token
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<KeyRound className="h-5 w-5" />
						API Tokens
					</CardTitle>
				</CardHeader>
				<CardContent>{content}</CardContent>
			</Card>

			<Dialog onOpenChange={handleCloseDialog} open={showCreateDialog}>
				<DialogContent
					aria-describedby="create-token-description"
					className="sm:max-w-md"
				>
					<DialogHeader>
						<DialogTitle>
							{createdToken ? "Token Created" : "Generate New Token"}
						</DialogTitle>
						<DialogDescription hidden id="create-token-description">
							Create a new API token for MCP access.
						</DialogDescription>
					</DialogHeader>

					{createdToken ? (
						<div className="space-y-4">
							<p className="text-muted-foreground text-sm">
								Copy this token now. You won't be able to see it again.
							</p>
							<div className="flex items-center gap-2">
								<code className="flex-1 overflow-x-auto rounded border bg-muted px-3 py-2 text-xs">
									{createdToken}
								</code>
								<Button onClick={handleCopyToken} size="icon" variant="outline">
									{copied ? (
										<Check className="h-4 w-4 text-green-500" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
							<div className="pt-2">
								<p className="mb-1 text-muted-foreground text-xs">
									Set this as your environment variable:
								</p>
								<code className="block rounded bg-muted px-3 py-2 text-xs">
									export KANBAN_MCP_TOKEN={createdToken}
								</code>
							</div>
							<Button className="w-full" onClick={handleCloseDialog}>
								Done
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="token-name">Token Name</Label>
								<Input
									id="token-name"
									onChange={(e) => setNewTokenName(e.target.value)}
									placeholder="e.g. My AI Agent"
									value={newTokenName}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="token-project">Project</Label>
								<select
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									id="token-project"
									onChange={(e) => setSelectedProjectId(e.target.value)}
									value={selectedProjectId}
								>
									<option disabled value="">
										Select a project...
									</option>
									{projects?.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name}
										</option>
									))}
								</select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="token-expiry">Expires In</Label>
								<select
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									id="token-expiry"
									onChange={(e) => setSelectedExpiry(e.target.value)}
									value={selectedExpiry}
								>
									{EXPIRY_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>
							</div>

							<Button
								className="w-full"
								disabled={createMutation.isPending}
								onClick={handleCreate}
							>
								{createMutation.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Generate Token
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default SettingsPage;
