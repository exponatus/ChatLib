import { z } from 'zod';
import { insertAssistantSchema, insertDocumentSchema, assistants, documents, conversations, messages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  assistants: {
    list: {
      method: 'GET' as const,
      path: '/api/assistants',
      responses: {
        200: z.array(z.custom<typeof assistants.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/assistants/:id',
      responses: {
        200: z.custom<typeof assistants.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/assistants',
      input: insertAssistantSchema,
      responses: {
        201: z.custom<typeof assistants.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/assistants/:id',
      input: insertAssistantSchema.partial(),
      responses: {
        200: z.custom<typeof assistants.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/assistants/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/assistants/:assistantId/documents',
      responses: {
        200: z.array(z.custom<typeof documents.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/assistants/:assistantId/documents',
      input: insertDocumentSchema.omit({ assistantId: true }),
      responses: {
        201: z.custom<typeof documents.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/documents/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  // Public/Embedded Chat API
  chat: {
    createSession: {
      method: 'POST' as const,
      path: '/api/chat/session',
      input: z.object({
        assistantId: z.number(),
      }),
      responses: {
        201: z.custom<typeof conversations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    sendMessage: {
      method: 'POST' as const,
      path: '/api/chat/session/:id/message',
      input: z.object({
        content: z.string(),
      }),
      responses: {
        200: z.object({ status: z.literal('success') }), // Streaming response handled separately
        404: errorSchemas.notFound,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/chat/session/:id/history',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
