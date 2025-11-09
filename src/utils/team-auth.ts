import "server-only";
import { cache } from "react";
import { requireVerifiedEmail } from "./auth";
import { ZSAError } from "zsa";

// Check if the user has team membership and return both access status and session
// This function doesn't throw exceptions, making it easier to use in pages
export const hasTeamMembership = cache(async (teamId: string) => {
  const session = await requireVerifiedEmail();

  if (!session) {
    return { hasAccess: false };
  }

  const isMember = session.teams?.some(team => team.id === teamId) || false;

  return {
    hasAccess: isMember,
    session: isMember ? session : undefined
  };
});

// Check if the user has a specific permission in a team
export const hasTeamPermission = cache(async (teamId: string, permission: string) => {
  const session = await requireVerifiedEmail();

  if (!session) {
    return false;
  }

  const team = session.teams?.find(t => t.id === teamId);

  if (!team) {
    return false;
  }

  // Check if the permission is in the user's permissions for this team
  return team.permissions.includes(permission);
});

// Require team permission (throws if doesn't have permission)
export const requireTeamPermission = cache(async (teamId: string, permission: string) => {
  const session = await requireVerifiedEmail();

  if (!session) {
    throw new ZSAError("NOT_AUTHORIZED", "Not authenticated");
  }

  const hasPermission = await hasTeamPermission(teamId, permission);

  if (!hasPermission) {
    throw new ZSAError("FORBIDDEN", "You don't have the required permission in this team");
  }

  return session;
});
