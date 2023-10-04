import type { Request, Response } from 'express';
import type { Context } from '.keystone/types';

export async function getEvents(req: Request, res: Response, context: Context) {
  console.log('getEvent');
  const events = await context.query.Event.findMany({
    // where: {
    //   isComplete,
    // },
    query: `
     id
     title
     content { document }
    `,
  });

  // And return the result as JSON
  res.json(events);
}
