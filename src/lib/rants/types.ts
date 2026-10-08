export type RantInput = { title: string; location: string; body: string; imagePath?: string | null; generationId?: string | null };
export type RantSummary = { id: string; title: string; location: string };
export type Rant = RantSummary & { body: string; image_path: string | null; generation_id: string | null; is_example: boolean; created_at: string };
export type RantComment = { id: string; body: string; created_at: string };
export type VoteTotals = { upvotes: number; downvotes: number; score: number };
export type RantDetail = Rant & { imageUrl: string | null; comments: RantComment[]; commentsCount: number; commentsPage: number; hasOlderComments: boolean; totals: VoteTotals; myVote: 1 | -1 | null };
