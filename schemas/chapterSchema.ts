import { list } from '@keystone-6/core';
import { allOperations, denyAll } from '@keystone-6/core/access';
import { checkbox, password, relationship, text, timestamp, image } from '@keystone-6/core/fields';
import { document } from '@keystone-6/fields-document';

import { isSignedIn, permissions, rules } from '../access';
import type { Session } from '../access';
import type { Lists } from '.keystone/types';

export const chapterSchema = list({
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
          return resolvedData.events;
          // return resolvedData.chapter;
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
});
