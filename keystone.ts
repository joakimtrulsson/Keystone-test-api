import { config } from '@keystone-6/core';
import { statelessSessions } from '@keystone-6/core/session';
import { createAuth } from '@keystone-6/auth';
import type { Request, Response } from 'express';
import { Context } from '.keystone/types';
import dotenv from 'dotenv';

import { lists } from './schema';
import { getEvents } from './routes/getEvents';
import { getPosts } from './routes/getPosts';

dotenv.config();

const { ASSET_BASE_URL: baseUrl = 'http://localhost:3000' } = process.env;

function withContext<F extends (req: Request, res: Response, context: Context) => void>(
  commonContext: Context,
  f: F
) {
  return async (req: Request, res: Response) => {
    return f(req, res, await commonContext.withRequest(req, res));
  };
}

// withAuth är en funktion runt base config.
const { withAuth } = createAuth({
  listKey: 'User',
  // Ett identity field på usern.
  identityField: 'name',
  secretField: 'password',
  initFirstItem: {
    fields: ['name', 'password'],

    // Följande data sparas som default på den första användaren.
    itemData: {
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
      cors: { origin: ['http://localhost:5173'], credentials: true },
      extendExpressApp: (app, commonContext) => {
        app.get('/api/events', withContext(commonContext, getEvents));
        app.get('/api/posts', withContext(commonContext, getPosts));
      },
    },
    lists,
    storage: {
      eventImages: {
        kind: 'local',
        type: 'image',
        generateUrl: (path) => `${baseUrl}/images${path}`,
        serverRoute: {
          path: '/images',
        },
        storagePath: 'public/event-images',
      },
      postImages: {
        kind: 'local',
        type: 'image',
        generateUrl: (path) => `${baseUrl}/post-images${path}`, // Justera sökvägen för postbilder
        serverRoute: {
          path: '/post-images', // Justera sökvägen för servern
        },
        storagePath: 'public/post-images', // Justera lagringsmappen för postbilder
      },
    },
    ui: {
      isAccessAllowed: ({ session }) => {
        return session?.data.role?.canUseAdminUI ?? false;
      },
    },
    session: statelessSessions(),
  })
);
