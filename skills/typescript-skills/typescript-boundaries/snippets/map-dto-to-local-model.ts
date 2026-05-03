type CreateNoteRequest = { title?: string; body?: string };
type CreateNoteInput = { title: string; body: string };

export function parseCreateNote(request: CreateNoteRequest): CreateNoteInput {
  if (!request.title || !request.body) throw new Error('missing fields');
  return { title: request.title, body: request.body };
}
