import { list } from '@keystone-6/core';
import { allOperations } from '@keystone-6/core/access';
import { relationship, text, timestamp, image } from '@keystone-6/core/fields';
import { document } from '@keystone-6/fields-document';

import { isSignedIn, permissions, rules } from '../access';

export const eventSchema = list({
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
    slug: text({ isIndexed: 'unique', validation: { isRequired: true } }),
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
});
