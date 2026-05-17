import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, User2 } from "lucide-react";

function SidebarUserDropdown() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const userInitials = useMemo(
    () =>
      user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    [user?.name]
  );

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton tooltip={user?.name ?? "User"}>
              {user ? (
                <Avatar size="sm">
                  {user.image && <AvatarImage src={user.image} />}
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              ) : (
                <User2 />
              )}
              <span>{user?.name ?? "User"}</span>
            </SidebarMenuButton>
          }
        />
        <DropdownMenuContent
          align="start"
          className="w-(--sidebar-width) min-w-40"
          side="top"
          sideOffset={4}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>{user?.email}</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (user?.username) {
                  navigate({
                    to: "/profile/$username",
                    params: { username: user.username },
                  });
                }
              }}
            >
              <User2 />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      navigate({ to: "/" });
                    },
                  },
                });
              }}
              variant="destructive"
            >
              <LogOut />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export default SidebarUserDropdown;
