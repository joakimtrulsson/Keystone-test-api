"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// keystone.ts
var keystone_exports = {};
__export(keystone_exports, {
  default: () => keystone_default
});
module.exports = __toCommonJS(keystone_exports);
var import_core2 = require("@keystone-6/core");
var import_session = require("@keystone-6/core/session");
var import_auth = require("@keystone-6/auth");

// schema.ts
var import_core = require("@keystone-6/core");
var import_access = require("@keystone-6/core/access");
var import_fields = require("@keystone-6/core/fields");
var import_fields_document = require("@keystone-6/fields-document");

// access.ts
function isSignedIn({ session }) {
  return Boolean(session);
}
var permissions = {
  canCreateItems: ({ session }) => session?.data.role?.canCreateItems ?? false,
  canManageAllItems: ({ session }) => session?.data.role?.canManageAllItems ?? false,
  canManageUsers: ({ session }) => session?.data.role?.canManageUsers ?? false,
  canManageRoles: ({ session }) => session?.data.role?.canManageRoles ?? false
  // TODO: add canViewAdminUI
};
var rules = {
  canReadItems: ({ session }) => {
    console.log("rules");
    if (!session)
      return true;
    if (session.data.role?.canManageAllItems) {
      return true;
    }
    return { author: { id: { equals: session.itemId } } };
  },
  canManageItems: ({ session }) => {
    if (!session)
      return false;
    if (session.data.role?.canManageAllItems)
      return true;
    return { author: { id: { equals: session.itemId } } };
  },
  canReadUsers: ({ session }) => {
    if (!session)
      return false;
    if (session.data.role?.canSeeOtherUsers)
      return true;
    return { id: { equals: session.itemId } };
  },
  canUpdateUsers: ({ session }) => {
    if (!session)
      return false;
    if (session.data.role?.canEditOtherUsers)
      return true;
    return { id: { equals: session.itemId } };
  }
};

// schema.ts
var lists = {
  Event: (0, import_core.list)({
    access: {
      operation: {
        ...(0, import_access.allOperations)(isSignedIn),
        create: permissions.canCreateItems,
        query: () => true
      },
      filter: {
        query: rules.canReadItems,
        update: rules.canManageItems,
        delete: rules.canManageItems
      }
    },
    ui: {
      hideCreate: (args) => !permissions.canCreateItems(args),
      listView: {
        initialColumns: ["title", "author"]
      }
    },
    fields: {
      title: (0, import_fields.text)({ validation: { isRequired: true } }),
      content: (0, import_fields_document.document)({
        formatting: true,
        dividers: true,
        links: true,
        layouts: [
          [1, 1],
          [1, 1, 1]
        ]
      }),
      eventStartDate: (0, import_fields.timestamp)(),
      author: (0, import_fields.relationship)({
        ref: "User.events",
        ui: {
          createView: {
            fieldMode: (args) => permissions.canManageAllItems(args) ? "edit" : "hidden"
          },
          itemView: {
            fieldMode: (args) => permissions.canManageAllItems(args) ? "edit" : "read"
          }
        },
        hooks: {
          resolveInput({ operation, resolvedData, context }) {
            if (operation === "create" && !resolvedData.author && context.session) {
              return { connect: { id: context.session.itemId } };
            }
            return resolvedData.author;
          }
        }
      })
    }
  }),
  Post: (0, import_core.list)({
    access: {
      operation: {
        ...(0, import_access.allOperations)(isSignedIn),
        create: permissions.canCreateItems,
        query: () => true
      },
      filter: {
        query: rules.canReadItems,
        update: rules.canManageItems,
        delete: rules.canManageItems
      }
    },
    ui: {
      hideCreate: (args) => !permissions.canCreateItems(args),
      listView: {
        initialColumns: ["title", "author"]
      }
    },
    fields: {
      title: (0, import_fields.text)({ validation: { isRequired: true } }),
      content: (0, import_fields_document.document)({
        formatting: true,
        dividers: true,
        links: true,
        layouts: [
          [1, 1],
          [1, 1, 1]
        ]
      }),
      publishedAt: (0, import_fields.timestamp)({
        defaultValue: { kind: "now" }
      }),
      author: (0, import_fields.relationship)({
        ref: "User.posts",
        ui: {
          createView: {
            fieldMode: (args) => permissions.canManageAllItems(args) ? "edit" : "hidden"
          },
          itemView: {
            fieldMode: (args) => permissions.canManageAllItems(args) ? "edit" : "read"
          }
        },
        hooks: {
          resolveInput({ operation, resolvedData, context }) {
            if (operation === "create" && !resolvedData.author && context.session) {
              return { connect: { id: context.session.itemId } };
            }
            return resolvedData.author;
          }
        }
      })
    }
  }),
  User: (0, import_core.list)({
    access: {
      operation: {
        ...(0, import_access.allOperations)(isSignedIn),
        create: permissions.canManageUsers,
        delete: permissions.canManageUsers
      },
      filter: {
        query: rules.canReadUsers,
        update: rules.canUpdateUsers
      }
    },
    ui: {
      hideCreate: (args) => !permissions.canManageUsers(args),
      hideDelete: (args) => !permissions.canManageUsers(args),
      listView: {
        initialColumns: ["name", "role", "events", "posts"]
      },
      itemView: {
        defaultFieldMode: ({ session, item }) => {
          if (session?.data.role?.canEditOtherUsers)
            return "edit";
          if (session?.itemId === item.id)
            return "edit";
          return "read";
        }
      }
    },
    fields: {
      // the user's name, used as the identity field for authentication
      //   should not be publicly visible
      //
      //   we use isIndexed to enforce names are unique
      //     that may not suitable for your application
      name: (0, import_fields.text)({
        isFilterable: false,
        isOrderable: false,
        isIndexed: "unique",
        validation: {
          isRequired: true
        }
      }),
      // the user's password, used as the secret field for authentication
      //   should not be publicly visible
      password: (0, import_fields.password)({
        access: {
          read: import_access.denyAll,
          // Event: is this required?
          update: ({ session, item }) => permissions.canManageUsers({ session }) || session?.itemId === item.id
        },
        validation: { isRequired: true }
      }),
      /* The role assigned to the user */
      role: (0, import_fields.relationship)({
        ref: "Role.author",
        access: {
          create: permissions.canManageUsers,
          update: permissions.canManageUsers
        },
        ui: {
          itemView: {
            fieldMode: (args) => permissions.canManageUsers(args) ? "edit" : "read"
          }
        }
      }),
      /* Event items assigned to the user */
      events: (0, import_fields.relationship)({
        ref: "Event.author",
        many: true,
        access: {
          // only Users with canManageAllItems can set this field when creating other users
          create: permissions.canManageAllItems,
          // you can only update this field with canManageAllItems, or for yourself
          update: ({ session, item }) => permissions.canManageAllItems({ session }) || session?.itemId === item.id
        },
        ui: {
          createView: {
            // Note you can only see the create view if you can manage Users, so we just need to
            // check the canManageAllItems permission here
            fieldMode: (args) => permissions.canManageAllItems(args) ? "edit" : "hidden"
          },
          // Event lists can be potentially quite large, so it's impractical to edit this field in
          // the item view. Always set it to read mode.
          itemView: { fieldMode: "read" }
        }
      }),
      posts: (0, import_fields.relationship)({
        ref: "Post.author",
        many: true,
        access: {
          // only Users with canManageAllItems can set this field when creating other users
          create: permissions.canManageAllItems,
          // you can only update this field with canManageAllItems, or for yourself
          update: ({ session, item }) => permissions.canManageAllItems({ session }) || session?.itemId === item.id
        },
        ui: {
          createView: {
            // Note you can only see the create view if you can manage Users, so we just need to
            // check the canManageAllItems permission here
            fieldMode: (args) => permissions.canManageAllItems(args) ? "edit" : "hidden"
          },
          // Event lists can be potentially quite large, so it's impractical to edit this field in
          // the item view. Always set it to read mode.
          itemView: { fieldMode: "read" }
        }
      })
    }
  }),
  Role: (0, import_core.list)({
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
        ...(0, import_access.allOperations)(permissions.canManageRoles),
        query: isSignedIn
      }
    },
    ui: {
      hideCreate: (args) => !permissions.canManageRoles(args),
      hideDelete: (args) => !permissions.canManageRoles(args),
      listView: {
        initialColumns: ["name", "author"]
      },
      itemView: {
        defaultFieldMode: (args) => permissions.canManageRoles(args) ? "edit" : "read"
      }
    },
    fields: {
      name: (0, import_fields.text)({ validation: { isRequired: true } }),
      /* Create Items means:
         - create Items (can only assign them to others with canManageAllItems) */
      canCreateItems: (0, import_fields.checkbox)({ defaultValue: false }),
      /* Manage All Items means:
         - create new Event items and assign them to someone else (with canCreateItems)
         - update and delete Event items not assigned to the current user */
      canManageAllItems: (0, import_fields.checkbox)({ defaultValue: false }),
      /* See Other Users means:
         - list all users in the database (users can always see themselves) */
      canSeeOtherUsers: (0, import_fields.checkbox)({ defaultValue: false }),
      /* Edit Other Users means:
         - edit other users in the database (users can always edit their own item) */
      canEditOtherUsers: (0, import_fields.checkbox)({ defaultValue: false }),
      /* Manage Users means:
         - change passwords (users can always change their own password)
         - assign roles to themselves and other users */
      canManageUsers: (0, import_fields.checkbox)({ defaultValue: false }),
      /* Manage Roles means:
         - create, edit, and delete roles */
      canManageRoles: (0, import_fields.checkbox)({ defaultValue: false }),
      /* Use AdminUI means:
         - can access the Admin UI next app */
      canUseAdminUI: (0, import_fields.checkbox)({ defaultValue: false }),
      author: (0, import_fields.relationship)({
        ref: "User.role",
        many: true,
        ui: {
          itemView: { fieldMode: "read" }
        }
      })
    }
  })
};

// routes/getEvents.ts
async function getEvents(req, res, context) {
  console.log("getEvent");
  const events = await context.query.Event.findMany({
    // where: {
    //   isComplete,
    // },
    query: `
     id
     title
     content { document }
    `
  });
  res.json(events);
}

// routes/getPosts.ts
async function getPosts(req, res, context) {
  console.log("getPosts");
  const posts = await context.query.Post.findMany({
    query: `
     id
     title
     content { document }
    `
  });
  res.json(posts);
}

// keystone.ts
function withContext(commonContext, f) {
  return async (req, res) => {
    return f(req, res, await commonContext.withRequest(req, res));
  };
}
var { withAuth } = (0, import_auth.createAuth)({
  // this is the list that contains our users
  listKey: "User",
  // an identity field, typically a username or an email address
  identityField: "name",
  // a secret field must be a password field type
  secretField: "password",
  // initFirstItem enables the "First User" experience, this will add an interface form
  //   adding a new User item if the database is empty
  //
  // WARNING: do not use initFirstItem in production
  //   see https://keystonejs.com/docs/config/auth#init-first-item for more
  initFirstItem: {
    // the following fields are used by the "Create First User" form
    fields: ["name", "password"],
    // the following fields are configured by default for this item
    itemData: {
      /*
        This creates a related role with full permissions, so that when the first user signs in
        they have complete access to the system (without this, you couldn't do anything)
      */
      role: {
        create: {
          name: "Admin Role",
          canCreateItems: true,
          canManageAllItems: true,
          canSeeOtherUsers: true,
          canEditOtherUsers: true,
          canManageUsers: true,
          canManageRoles: true,
          canUseAdminUI: true
        }
      }
    }
  },
  sessionData: `
    name
    role {
      id
      name
      canCreateItems
      canManageAllItems
      canSeeOtherUsers
      canEditOtherUsers
      canManageUsers
      canManageRoles
      canUseAdminUI
    }`
});
var keystone_default = withAuth(
  (0, import_core2.config)({
    db: {
      provider: "sqlite",
      url: process.env.DATABASE_URL || "file:./database.db"
    },
    server: {
      /*
        This is the main part of this example. Here we include a function that
        takes the express app Keystone created, and does two things:
        - Adds a middleware function that will run on requests matching our REST
          API routes, to get a keystone context on `req`. This means we don't
          need to put our route handlers in a closure and repeat it for each.
        - Adds a GET handler for tasks, which will query for tasks in the
          Keystone schema and return the results as JSON
      */
      extendExpressApp: (app, commonContext) => {
        app.get("/api/events", withContext(commonContext, getEvents));
        app.get("/api/posts", withContext(commonContext, getPosts));
      }
    },
    lists,
    ui: {
      isAccessAllowed: ({ session }) => {
        return session?.data.role?.canUseAdminUI ?? false;
      }
    },
    // you can find out more at https://keystonejs.com/docs/apis/session#session-api
    session: (0, import_session.statelessSessions)()
  })
);
//# sourceMappingURL=config.js.map
