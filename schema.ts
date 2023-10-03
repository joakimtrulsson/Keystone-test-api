import { list } from '@keystone-6/core';
import { allOperations, denyAll } from '@keystone-6/core/access';
import { checkbox, password, relationship, text, timestamp } from '@keystone-6/core/fields';
import { document } from '@keystone-6/fields-document';

import { isSignedIn, permissions, rules } from './access';
import type { Session } from './access';
import type { Lists } from '.keystone/types';

// WARNING: this example is for demonstration purposes only
//   as with each of our examples, it has not been vetted
//   or tested for any particular usage

/*
  The set of permissions a role could have would change based on application requirements, so the
  checkboxes in the Role list below are fairly arbitary to demonstrate the idea.

  The default permissions (not assigned with roles) in this example are:
  - All users can sign into the Admin UI
  - All users can see and manage Event items assigned to themselves
*/

export const lists: Lists<Session> = {
  Event: list({
    /*
      SPEC
      - [x] Block all public access
      - [x] Restrict list create based on canCreateItems
      - [x] Restrict list read based on canManageAllItems and isPrivate
        - [x] Users without canManageAllItems can only see their own Event items
        - [x] Users can never see Event items with isPrivate unless assigned to themselves
      - [x] Restrict list update / delete based on canManageAllItems
        - [x] Users can always update / delete their own Event items
        - [x] Users can only update / delete Event items assigned to other Users with canManageAllItems
      - [ ] Validate assignment on create based on canManageAllItems
        - [ ] Users without canManageAllItems can only create Items assigned to themselves
        - [ ] Users with canManageAllItems can create and assign Items to anyone
        - [ ] Nobody can create private users assigned to another user
      - [ ] Extend the Admin UI to stop Users creating private Items assigned to someone else
    */
    access: {
      operation: {
        ...allOperations(isSignedIn),
        create: permissions.canCreateItems,
      },
      filter: {
        query: rules.canReadItems,
        update: rules.canManageItems,
        delete: rules.canManageItems,
      },
    },
    ui: {
      hideCreate: (args) => !permissions.canCreateItems(args),
      listView: {
        initialColumns: ['title', 'author'],
      },
    },
    fields: {
      title: text({ validation: { isRequired: true } }),
      content: document({
        formatting: true,
        dividers: true,
        links: true,
        layouts: [
          [1, 1],
          [1, 1, 1],
        ],
      }),
      eventStartDate: timestamp(),
      author: relationship({
        ref: 'User.events',
        ui: {
          createView: {
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'hidden'),
          },
          itemView: {
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'read'),
          },
        },
        hooks: {
          beforeOperation: (params) => {
            if (params.operation.type === 'query') {
              // Tillåt alla användare att göra GET-förfrågningar (hämta) händelser.
              return true;
            }
          },
          resolveInput({ operation, resolvedData, context }) {
            if (operation === 'create' && !resolvedData.author && context.session) {
              // Always default new Event items to the current user; this is important because users
              // without canManageAllItems don't see this field when creating new items
              return { connect: { id: context.session.itemId } };
            }
            return resolvedData.author;
          },
        },
      }),
    },
  }),
  User: list({
    /*
      SPEC
      - [x] Block all public access
      - [x] Restrict list create based on canManageUsers
      - [x] Restrict list read based on canSeeOtherUsers
      - [x] Restrict list update based on canEditOtherUsers
      - [x] Restrict list delete based on canManageUsers
      - [x] Restrict role field update based on canManageUsers
      - [x] Restrict password field update based on same item or canManageUsers
      - [x] Restrict tasks based on same item or canManageItems
    */
    access: {
      operation: {
        ...allOperations(isSignedIn),
        create: permissions.canManageUsers,
        delete: permissions.canManageUsers,
      },
      filter: {
        query: rules.canReadUsers,
        update: rules.canUpdateUsers,
      },
    },
    ui: {
      hideCreate: (args) => !permissions.canManageUsers(args),
      hideDelete: (args) => !permissions.canManageUsers(args),
      listView: {
        initialColumns: ['name', 'role', 'events'],
      },
      itemView: {
        defaultFieldMode: ({ session, item }) => {
          // canEditOtherUsers can edit other Users
          if (session?.data.role?.canEditOtherUsers) return 'edit';

          // edit themselves
          if (session?.itemId === item.id) return 'edit';

          // else, default all fields to read mode
          return 'read';
        },
      },
    },
    fields: {
      // the user's name, used as the identity field for authentication
      //   should not be publicly visible
      //
      //   we use isIndexed to enforce names are unique
      //     that may not suitable for your application
      name: text({
        isFilterable: false,
        isOrderable: false,
        isIndexed: 'unique',
        validation: {
          isRequired: true,
        },
      }),
      // the user's password, used as the secret field for authentication
      //   should not be publicly visible
      password: password({
        access: {
          read: denyAll, // Event: is this required?
          update: ({ session, item }) =>
            permissions.canManageUsers({ session }) || session?.itemId === item.id,
        },
        validation: { isRequired: true },
      }),
      /* The role assigned to the user */
      role: relationship({
        ref: 'Role.author',
        access: {
          create: permissions.canManageUsers,
          update: permissions.canManageUsers,
        },
        ui: {
          itemView: {
            fieldMode: (args) => (permissions.canManageUsers(args) ? 'edit' : 'read'),
          },
        },
      }),
      /* Event items assigned to the user */
      events: relationship({
        ref: 'Event.author',
        many: true,
        access: {
          // only Users with canManageAllItems can set this field when creating other users
          create: permissions.canManageAllItems,

          // you can only update this field with canManageAllItems, or for yourself
          update: ({ session, item }) =>
            permissions.canManageAllItems({ session }) || session?.itemId === item.id,
        },
        ui: {
          createView: {
            // Note you can only see the create view if you can manage Users, so we just need to
            // check the canManageAllItems permission here
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'hidden'),
          },
          // Event lists can be potentially quite large, so it's impractical to edit this field in
          // the item view. Always set it to read mode.
          itemView: { fieldMode: 'read' },
        },
      }),
    },
  }),
  Role: list({
    /*
      SPEC
      - [x] Block all public access
      - [x] Restrict edit access based on canManageRoles
      - [ ] Prevent users from deleting their own role
      - [ ] Add a pre-save hook that ensures some permissions are selected when others are:
          - [ ] when canEditOtherUsers is true, canSeeOtherUsers must be true
          - [ ] when canManageUsers is true, canEditOtherUsers and canSeeOtherUsers must be true
      - [ ] Extend the Admin UI with client-side validation based on the same set of rules
    */
    access: {
      operation: {
        ...allOperations(permissions.canManageRoles),
        query: isSignedIn,
      },
    },
    ui: {
      hideCreate: (args) => !permissions.canManageRoles(args),
      hideDelete: (args) => !permissions.canManageRoles(args),
      listView: {
        initialColumns: ['name', 'author'],
      },
      itemView: {
        defaultFieldMode: (args) => (permissions.canManageRoles(args) ? 'edit' : 'read'),
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),

      /* Create Items means:
         - create Items (can only assign them to others with canManageAllItems) */
      canCreateItems: checkbox({ defaultValue: false }),
      /* Manage All Items means:
         - create new Event items and assign them to someone else (with canCreateItems)
         - update and delete Event items not assigned to the current user */
      canManageAllItems: checkbox({ defaultValue: false }),
      /* See Other Users means:
         - list all users in the database (users can always see themselves) */
      canSeeOtherUsers: checkbox({ defaultValue: false }),
      /* Edit Other Users means:
         - edit other users in the database (users can always edit their own item) */
      canEditOtherUsers: checkbox({ defaultValue: false }),
      /* Manage Users means:
         - change passwords (users can always change their own password)
         - assign roles to themselves and other users */
      canManageUsers: checkbox({ defaultValue: false }),
      /* Manage Roles means:
         - create, edit, and delete roles */
      canManageRoles: checkbox({ defaultValue: false }),
      /* Use AdminUI means:
         - can access the Admin UI next app */
      canUseAdminUI: checkbox({ defaultValue: false }),

      author: relationship({
        ref: 'User.role',
        many: true,
        ui: {
          itemView: { fieldMode: 'read' },
        },
      }),
    },
  }),
};
