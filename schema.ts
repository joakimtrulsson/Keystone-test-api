import { list } from '@keystone-6/core';
import { allOperations, denyAll } from '@keystone-6/core/access';
import { checkbox, password, relationship, text, timestamp } from '@keystone-6/core/fields';
import { document } from '@keystone-6/fields-document';

import { isSignedIn, permissions, rules } from './access';
import type { Session } from './access';
import type { Lists } from '.keystone/types';

export const lists: Lists<Session> = {
  Event: list({
    access: {
      operation: {
        ...allOperations(isSignedIn),
        create: permissions.canCreateItems,
        query: () => true,
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
        initialColumns: ['title', 'chapter', 'author'],
      },
    },
    fields: {
      title: text({ validation: { isRequired: true } }),
      chapter: relationship({
        ref: 'Chapter.events', // Detta bör peka på namnet på ditt relationsfält i Chapter-listan
        many: true, // Ändra till true om ett Event kan tillhöra flera Chapters
      }),
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
  Chapter: list({
    access: {
      operation: {
        ...allOperations(isSignedIn),
        create: permissions.canCreateItems,
        query: () => true,
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
      desc: text({ validation: { isRequired: true } }),
      events: relationship({
        ref: 'Event.chapter', // Detta bör peka på namnet på ditt relationsfält i Event-listan
        many: true, // Ändra till true om flera Events kan kopplas till ett Chapter
        ui: {
          createView: {
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'hidden'),
          },
          itemView: {
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'read'),
          },
        },
        hooks: {
          resolveInput({ operation, resolvedData, context }) {
            // Här kan du lägga till logik för att ansluta ditt Chapter till Event om det är nödvändigt
            return resolvedData.chapter;
          },
        },
      }),

      author: relationship({
        ref: 'User.chapters',
        ui: {
          createView: {
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'hidden'),
          },
          itemView: {
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'read'),
          },
        },
        hooks: {
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
  Post: list({
    access: {
      operation: {
        ...allOperations(isSignedIn),
        create: permissions.canCreateItems,
        query: () => true,
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
      publishedAt: timestamp({
        defaultValue: { kind: 'now' },
      }),
      author: relationship({
        ref: 'User.posts',
        ui: {
          createView: {
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'hidden'),
          },
          itemView: {
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'read'),
          },
        },
        hooks: {
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
        initialColumns: ['name', 'role'],
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

      posts: relationship({
        ref: 'Post.author',
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
      chapters: relationship({
        ref: 'Chapter.author',
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
