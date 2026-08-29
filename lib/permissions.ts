// ─────────────────────────────────────────────────────────────────────────────
// Permission system for Phase A — Roles & Designations
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSION_KEYS = [
  "members.view",
  "members.create",
  "members.edit",
  "members.delete",
  "events.view",
  "events.manage",
  "news.manage",
  "meetings.view",
  "meetings.manage",
  "finances.view",
  "finances.edit",
  "reports.view",
  "settings.manage",
  "communications.send",
] as const;

export type Permission = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "members.view": "View Members",
  "members.create": "Add Members",
  "members.edit": "Edit Members",
  "members.delete": "Delete Members",
  "events.view": "View Events",
  "events.manage": "Manage Events",
  "news.manage": "Manage News",
  "meetings.view": "View Meetings",
  "meetings.manage": "Manage Meetings",
  "finances.view": "View Finances",
  "finances.edit": "Edit Finances",
  "reports.view": "View Reports",
  "settings.manage": "Manage Settings",
  "communications.send": "Send Communications",
};

// Default designations seeded for every new association
export const DEFAULT_DESIGNATIONS: Array<{
  name: string;
  systemRole: string;
  permissions: Permission[];
  isDefault: boolean;
  order: number;
}> = [
  {
    name: "President",
    systemRole: "admin",
    permissions: [],
    isDefault: false,
    order: 1,
  },
  {
    name: "Vice President",
    systemRole: "editor",
    permissions: ["meetings.view", "meetings.manage", "members.view", "events.view"],
    isDefault: false,
    order: 2,
  },
  {
    name: "Secretary",
    systemRole: "editor",
    permissions: [
      "meetings.manage",
      "meetings.view",
      "members.view",
      "members.edit",
      "members.create",
      "communications.send",
    ],
    isDefault: false,
    order: 3,
  },
  {
    name: "Treasurer",
    systemRole: "editor",
    permissions: ["finances.view", "finances.edit", "reports.view"],
    isDefault: false,
    order: 4,
  },
  {
    name: "Committee Member",
    systemRole: "editor",
    permissions: ["meetings.view", "members.view", "events.view"],
    isDefault: false,
    order: 5,
  },
  {
    name: "General Member",
    systemRole: "member",
    permissions: [],
    isDefault: true,
    order: 6,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Permission check helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminContextUser {
  systemRole: string;
  permissions: string[]; // merged: designation.permissions + extraPermissions
}

/**
 * Returns true if the user can perform the action.
 * - "admin" systemRole: always true
 * - "member" systemRole: always false (portal only)
 * - "editor" systemRole: true only if permission is in their merged set
 */
export function hasPermission(
  user: AdminContextUser,
  permission: Permission
): boolean {
  if (user.systemRole === "admin") return true;
  if (user.systemRole === "member") return false;
  return user.permissions.includes(permission);
}

/** Merge designation permissions + extraPermissions into a single array */
export function mergePermissions(
  designationPermissions: string[],
  extraPermissions: string[]
): string[] {
  const set = new Set([...designationPermissions, ...extraPermissions]);
  return Array.from(set);
}
