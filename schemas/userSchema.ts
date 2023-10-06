import { list } from '@keystone-6/core';
import { allOperations, denyAll } from '@keystone-6/core/access';
import { password, relationship, text } from '@keystone-6/core/fields';

import { isSignedIn, permissions, rules } from '../access';

export const userSchema = list({
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
        update: ({ session, item }) => permissions.canManageUsers({ session }) || session?.itemId === item.id,
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
});
