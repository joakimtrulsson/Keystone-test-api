export type Session = {
  itemId: string;
  listKey: string;
  data: {
    name: string;
    role: {
      id: string;
      name: string;
      canCreateItems: boolean;
      canManageAllItems: boolean;
      canSeeOtherUsers: boolean;
      canEditOtherUsers: boolean;
      canManageUsers: boolean;
      canManageRoles: boolean;
      canUseAdminUI: boolean;
    };
  };
};

type AccessArgs = {
  session?: Session;
};

// this function checks only that a session actually exists, nothing else
export function isSignedIn({ session }: AccessArgs) {
  return Boolean(session);
}

/*
  Permissions are shorthand functions for checking that the current user's role has the specified
  permission boolean set to true
*/
export const permissions = {
  canCreateItems: ({ session }: AccessArgs) => session?.data.role?.canCreateItems ?? false,
  canManageAllItems: ({ session }: AccessArgs) => session?.data.role?.canManageAllItems ?? false,
  canManageUsers: ({ session }: AccessArgs) => session?.data.role?.canManageUsers ?? false,
  canManageRoles: ({ session }: AccessArgs) => session?.data.role?.canManageRoles ?? false,
  // TODO: add canViewAdminUI
};

/*
  Rules are logical functions that can be used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items
*/
export const rules = {
  canReadItems: ({ session }: AccessArgs) => {
    console.log('rules');
    if (!session) return true;

    if (session.data.role?.canManageAllItems) {
      return true;
    }

    // default to only seeing your own Items
    return { author: { id: { equals: session.itemId } } };
    // return true;
  },
  canManageItems: ({ session }: AccessArgs) => {
    if (!session) return false;

    // can manage every item?
    if (session.data.role?.canManageAllItems) return true;

    // default to only managing your own Items
    return { author: { id: { equals: session.itemId } } };
  },
  canReadUsers: ({ session }: AccessArgs) => {
    if (!session) return false;

    // can see everyone?
    if (session.data.role?.canSeeOtherUsers) return true;

    // default to only seeing yourself
    return { id: { equals: session.itemId } };
  },
  canUpdateUsers: ({ session }: AccessArgs) => {
    if (!session) return false;

    // can update everyone?
    if (session.data.role?.canEditOtherUsers) return true;

    // default to only updating yourself
    return { id: { equals: session.itemId } };
  },
};
