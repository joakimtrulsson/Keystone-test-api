import { config } from '@keystone-6/core';
import { statelessSessions } from '@keystone-6/core/session';
import { createAuth } from '@keystone-6/auth';
import type { Request, Response } from 'express';
import { TypeInfo, Context } from '.keystone/types';
// import { fixPrismaPath } from '../example-utils';
import { lists } from './schema';
import { KeystoneContext } from '@keystone-6/core/types';
import { getEvents } from './routes/getEvents';
import { getPosts } from './routes/getPosts';

function withContext<F extends (req: Request, res: Response, context: Context) => void>(
  commonContext: Context,
  f: F
) {
  return async (req: Request, res: Response) => {
    return f(req, res, await commonContext.withRequest(req, res));
  };
}

// WARNING: this example is for demonstration purposes only
//   as with each of our examples, it has not been vetted
//   or tested for any particular usage

// withAuth is a function we can use to wrap our base configuration
const { withAuth } = createAuth({
  // this is the list that contains our users
  listKey: 'User',

  // an identity field, typically a username or an email address
  identityField: 'name',

  // a secret field must be a password field type
  secretField: 'password',

  // initFirstItem enables the "First User" experience, this will add an interface form
  //   adding a new User item if the database is empty
  //
  // WARNING: do not use initFirstItem in production
  //   see https://keystonejs.com/docs/config/auth#init-first-item for more
  initFirstItem: {
    // the following fields are used by the "Create First User" form
    fields: ['name', 'password'],

    // the following fields are configured by default for this item
    itemData: {
      /*
        This creates a related role with full permissions, so that when the first user signs in
        they have complete access to the system (without this, you couldn't do anything)
      */
      role: {
        create: {
          name: 'Admin Role',
          canCreateItems: true,
          canManageAllItems: true,
          canSeeOtherUsers: true,
          canEditOtherUsers: true,
          canManageUsers: true,
          canManageRoles: true,
          canUseAdminUI: true,
        },
      },
    },
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
    }`,
});

export default withAuth(
  config({
    db: {
      provider: 'sqlite',
      url: process.env.DATABASE_URL || 'file:./database.db',
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
        app.get('/api/events', withContext(commonContext, getEvents));
        app.get('/api/posts', withContext(commonContext, getPosts));
      },
    },
    lists,
    ui: {
      isAccessAllowed: ({ session }) => {
        return session?.data.role?.canUseAdminUI ?? false;
      },
    },
    // you can find out more at https://keystonejs.com/docs/apis/session#session-api
    session: statelessSessions(),
  })
);
