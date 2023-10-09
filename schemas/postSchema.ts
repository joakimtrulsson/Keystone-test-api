import { list } from '@keystone-6/core';
import { allOperations } from '@keystone-6/core/access';
import { image, relationship, text, timestamp } from '@keystone-6/core/fields';
import { document } from '@keystone-6/fields-document';

import { componentBlocks } from '../component-blocks';

import { isSignedIn, permissions, rules } from '../access';

export const postSchema = list({
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
      ui: {
        views: './component-blocks',
      },
      componentBlocks,
    }),
    slug: text({ isIndexed: 'unique', validation: { isRequired: true } }),
    postImage: image({ storage: 'postImages' }),
    publishDate: timestamp({
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
});
