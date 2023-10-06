"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// keystone.ts
var keystone_exports = {};
__export(keystone_exports, {
  default: () => keystone_default
});
module.exports = __toCommonJS(keystone_exports);
var import_core6 = require("@keystone-6/core");
var import_session = require("@keystone-6/core/session");
var import_auth = require("@keystone-6/auth");
var import_dotenv = __toESM(require("dotenv"));

// schemas/userSchema.ts
var import_core = require("@keystone-6/core");
var import_access = require("@keystone-6/core/access");
var import_fields = require("@keystone-6/core/fields");

// access.ts
function isSignedIn({ session }) {
  return Boolean(session);
}
var permissions = {
  canCreateItems: ({ session }) => session?.data.role?.canCreateItems ?? false,
  canManageAllItems: ({ session }) => session?.data.role?.canManageAllItems ?? false,
  canManageUsers: ({ session }) => session?.data.role?.canManageUsers ?? false,
  canManageRoles: ({ session }) => session?.data.role?.canManageRoles ?? false
};
var rules = {
  canReadItems: ({ session }) => {
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

// schemas/userSchema.ts
var userSchema = (0, import_core.list)({
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
      initialColumns: ["name", "role"]
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
    //   isIndexed ser till att namnet är unikt
    name: (0, import_fields.text)({
      isFilterable: false,
      isOrderable: false,
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    password: (0, import_fields.password)({
      access: {
        read: import_access.denyAll,
        // Event: is this required?
        update: ({ session, item }) => permissions.canManageUsers({ session }) || session?.itemId === item.id
      },
      validation: { isRequired: true }
    }),
    //  Rolen som är kopplad till användare.
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
    //  item som är kopplad till användare.
    events: (0, import_fields.relationship)({
      ref: "Event.author",
      many: true,
      access: {
        // Endast med canManagaAllItems kan använda det här fältet åt andra användare.
        create: permissions.canManageAllItems,
        // Du kan endast uppdatera det här fältet med canMangageAllItems eller för dig själv.
        update: ({ session, item }) => permissions.canManageAllItems({ session }) || session?.itemId === item.id
      },
      ui: {
        createView: {
          // Du kan endast se edit view om du har canManageAllItems
          fieldMode: (args) => permissions.canManageAllItems(args) ? "edit" : "hidden"
        },
        itemView: { fieldMode: "read" }
      }
    }),
    posts: (0, import_fields.relationship)({
      ref: "Post.author",
      many: true,
      access: {
        // Du kan bara använda det här fältet om du har canMangaAllItems när du skapar en användare.
        create: permissions.canManageAllItems,
        // Du kan bara uppdatera det här fältet med canManageAllItems eller din egna användare.
        update: ({ session, item }) => permissions.canManageAllItems({ session }) || session?.itemId === item.id
      },
      ui: {
        createView: {
          // Du kan bara se createview om du har canManageAllItems
          fieldMode: (args) => permissions.canManageAllItems(args) ? "edit" : "hidden"
        },
        itemView: { fieldMode: "read" }
      }
    }),
    chapters: (0, import_fields.relationship)({
      ref: "Chapter.author",
      many: true,
      access: {
        create: permissions.canManageAllItems,
        update: ({ session, item }) => permissions.canManageAllItems({ session }) || session?.itemId === item.id
      },
      ui: {
        createView: {
          fieldMode: (args) => permissions.canManageAllItems(args) ? "edit" : "hidden"
        },
        itemView: { fieldMode: "read" }
      }
    })
  }
});

// schemas/eventSchema.ts
var import_core2 = require("@keystone-6/core");
var import_access3 = require("@keystone-6/core/access");
var import_fields2 = require("@keystone-6/core/fields");
var import_fields_document = require("@keystone-6/fields-document");
var eventSchema = (0, import_core2.list)({
  access: {
    operation: {
      ...(0, import_access3.allOperations)(isSignedIn),
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
      initialColumns: ["title", "chapter", "author"]
    }
  },
  fields: {
    title: (0, import_fields2.text)({ validation: { isRequired: true } }),
    chapter: (0, import_fields2.relationship)({
      ref: "Chapter.events",
      many: true
    }),
    content: (0, import_fields_document.document)({
      formatting: true,
      dividers: true,
      links: true,
      layouts: [
        [1, 1],
        [1, 1, 1]
      ]
    }),
    eventImg: (0, import_fields2.image)({ storage: "eventImages" }),
    eventStartDate: (0, import_fields2.timestamp)(),
    author: (0, import_fields2.relationship)({
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
});

// schemas/chapterSchema.ts
var import_core3 = require("@keystone-6/core");
var import_access5 = require("@keystone-6/core/access");
var import_fields3 = require("@keystone-6/core/fields");
var chapterSchema = (0, import_core3.list)({
  access: {
    operation: {
      ...(0, import_access5.allOperations)(isSignedIn),
      create: permissions.canCreateItems,
      query: () => true
    },
    filter: {
      query: () => true,
      // query: rules.canReadItems,
      update: rules.canManageItems,
      delete: rules.canManageItems
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canCreateItems(args),
    listView: {
      initialColumns: ["title", "author"]
    }
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
    title: (0, import_fields3.text)({ validation: { isRequired: true } }),
    desc: (0, import_fields3.text)({ validation: { isRequired: true } }),
    events: (0, import_fields3.relationship)({
      ref: "Event.chapter",
      many: true,
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
          return resolvedData.events;
        }
      }
    }),
    author: (0, import_fields3.relationship)({
      ref: "User.chapters",
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
});

// schemas/postSchema.ts
var import_core4 = require("@keystone-6/core");
var import_access7 = require("@keystone-6/core/access");
var import_fields4 = require("@keystone-6/core/fields");
var import_fields_document2 = require("@keystone-6/fields-document");
var postSchema = (0, import_core4.list)({
  access: {
    operation: {
      ...(0, import_access7.allOperations)(isSignedIn),
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
    title: (0, import_fields4.text)({ validation: { isRequired: true } }),
    content: (0, import_fields_document2.document)({
      formatting: true,
      dividers: true,
      links: true,
      layouts: [
        [1, 1],
        [1, 1, 1]
      ]
    }),
    publishedAt: (0, import_fields4.timestamp)({
      defaultValue: { kind: "now" }
    }),
    author: (0, import_fields4.relationship)({
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
});

// schemas/roleSchema.ts
var import_core5 = require("@keystone-6/core");
var import_access9 = require("@keystone-6/core/access");
var import_fields5 = require("@keystone-6/core/fields");
var roleSchema = (0, import_core5.list)({
  access: {
    operation: {
      ...(0, import_access9.allOperations)(permissions.canManageRoles),
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
    name: (0, import_fields5.text)({ validation: { isRequired: true } }),
    canCreateItems: (0, import_fields5.checkbox)({ defaultValue: false }),
    canManageAllItems: (0, import_fields5.checkbox)({ defaultValue: false }),
    canSeeOtherUsers: (0, import_fields5.checkbox)({ defaultValue: false }),
    canEditOtherUsers: (0, import_fields5.checkbox)({ defaultValue: false }),
    canManageUsers: (0, import_fields5.checkbox)({ defaultValue: false }),
    canManageRoles: (0, import_fields5.checkbox)({ defaultValue: false }),
    canUseAdminUI: (0, import_fields5.checkbox)({ defaultValue: false }),
    canReadChapters: (0, import_fields5.checkbox)({ defaultValue: false }),
    author: (0, import_fields5.relationship)({
      ref: "User.role",
      many: true,
      ui: {
        itemView: { fieldMode: "read" }
      }
    })
  }
});

// schema.ts
var lists = {
  Chapter: chapterSchema,
  Event: eventSchema,
  Post: postSchema,
  User: userSchema,
  Role: roleSchema
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
import_dotenv.default.config();
var { ASSET_BASE_URL: baseUrl = "http://localhost:3000" } = process.env;
function withContext(commonContext, f) {
  return async (req, res) => {
    return f(req, res, await commonContext.withRequest(req, res));
  };
}
var { withAuth } = (0, import_auth.createAuth)({
  listKey: "User",
  // Ett identity field på usern.
  identityField: "name",
  secretField: "password",
  initFirstItem: {
    fields: ["name", "password"],
    // Följande data sparas som default på den första användaren.
    itemData: {
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
  (0, import_core6.config)({
    db: {
      provider: "sqlite",
      url: process.env.DATABASE_URL || "file:./database.db"
    },
    server: {
      extendExpressApp: (app, commonContext) => {
        app.get("/api/events", withContext(commonContext, getEvents));
        app.get("/api/posts", withContext(commonContext, getPosts));
      }
    },
    lists,
    storage: {
      eventImages: {
        kind: "local",
        type: "image",
        generateUrl: (path) => `${baseUrl}/images${path}`,
        serverRoute: {
          path: "/images"
        },
        storagePath: "public/images"
      }
    },
    ui: {
      isAccessAllowed: ({ session }) => {
        return session?.data.role?.canUseAdminUI ?? false;
      }
    },
    session: (0, import_session.statelessSessions)()
  })
);
//# sourceMappingURL=config.js.map
