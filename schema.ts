import { list } from '@keystone-6/core';
import { allOperations, denyAll } from '@keystone-6/core/access';
import { checkbox, password, relationship, text, timestamp, image } from '@keystone-6/core/fields';
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
        ref: 'Chapter.events',
        many: true,
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
      eventImg: image({ storage: 'eventImages' }),
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
              // Nytt item länkas till användaren, detta är viktigt eftersom utan canManageAllItems syns inte det här fältet.
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
        query: () => true,
        // query: rules.canReadItems,
        update: rules.canManageItems,
        delete: rules.canManageItems,
      },
    },
    ui: {
      hideCreate: (args) => !permissions.canCreateItems(args),
      listView: {
        initialColumns: ['title', 'author'],
      },
      // itemView: {
      //   defaultFieldMode: ({ session, item }) => {
      //     console.log('session användare', session.itemId);
      //     console.log('item', item.authorId);
      //     // canMananageAllItems can edit other Chapters
      //     if (session?.data.role?.canManageAllItems) {
      //       console.log('här');
      //       return 'edit';
      //     }

      //     // edit themselves

      //     // if (session?.itemId === item.authorId) {
      //     //   console.log('där');
      //     //   return 'edit';
      //     // }

      //     // else, default all fields to read mode
      //     return 'read';
      //   },
      // },
    },
    fields: {
      title: text({ validation: { isRequired: true } }),
      desc: text({ validation: { isRequired: true } }),
      events: relationship({
        ref: 'Event.chapter',
        many: true,
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
              // Nytt item länkas till användaren, detta är viktigt eftersom utan canManageAllItems syns inte det här fältet.

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
              // Nytt item länkas till användaren, detta är viktigt eftersom utan canManageAllItems syns inte det här fältet.
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
          // canEditOtherUsers kan redigera andra användare
          if (session?.data.role?.canEditOtherUsers) return 'edit';

          // Redigera sin egna användare
          if (session?.itemId === item.id) return 'edit';
          // Annars read mode
          return 'read';
        },
      },
    },
    fields: {
      //   isIndexed ser till att namnet är unikt
      name: text({
        isFilterable: false,
        isOrderable: false,
        isIndexed: 'unique',
        validation: {
          isRequired: true,
        },
      }),
      password: password({
        access: {
          read: denyAll, // Event: is this required?
          update: ({ session, item }) =>
            permissions.canManageUsers({ session }) || session?.itemId === item.id,
        },
        validation: { isRequired: true },
      }),

      //  Rolen som är kopplad till användare.
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

      //  item som är kopplad till användare.
      events: relationship({
        ref: 'Event.author',
        many: true,
        access: {
          // Endast med canManagaAllItems kan använda det här fältet åt andra användare.
          create: permissions.canManageAllItems,
          // Du kan endast uppdatera det här fältet med canMangageAllItems eller för dig själv.
          update: ({ session, item }) =>
            permissions.canManageAllItems({ session }) || session?.itemId === item.id,
        },
        ui: {
          createView: {
            // Du kan endast se edit view om du har canManageAllItems
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'hidden'),
          },
          itemView: { fieldMode: 'read' },
        },
      }),

      posts: relationship({
        ref: 'Post.author',
        many: true,
        access: {
          // Du kan bara använda det här fältet om du har canMangaAllItems när du skapar en användare.
          create: permissions.canManageAllItems,

          // Du kan bara uppdatera det här fältet med canManageAllItems eller din egna användare.
          update: ({ session, item }) =>
            permissions.canManageAllItems({ session }) || session?.itemId === item.id,
        },
        ui: {
          createView: {
            // Du kan bara se createview om du har canManageAllItems
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'hidden'),
          },

          itemView: { fieldMode: 'read' },
        },
      }),
      chapters: relationship({
        ref: 'Chapter.author',
        many: true,
        access: {
          create: permissions.canManageAllItems,
          update: ({ session, item }) =>
            permissions.canManageAllItems({ session }) || session?.itemId === item.id,
        },
        ui: {
          createView: {
            fieldMode: (args) => (permissions.canManageAllItems(args) ? 'edit' : 'hidden'),
          },
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

      canCreateItems: checkbox({ defaultValue: false }),

      canManageAllItems: checkbox({ defaultValue: false }),

      canSeeOtherUsers: checkbox({ defaultValue: false }),

      canEditOtherUsers: checkbox({ defaultValue: false }),

      canManageUsers: checkbox({ defaultValue: false }),

      canManageRoles: checkbox({ defaultValue: false }),

      canUseAdminUI: checkbox({ defaultValue: false }),

      canReadChapters: checkbox({ defaultValue: false }),

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
