import type { Language } from "../i18n";
import type { VoteTotals } from "../rants/types";
export type MemeTemplate = {
  storagePath?: string;
  imageError?: boolean;
  id: string;
  name: string;
  imageUrl: string;
  sourceUrl: string;
  description: string;
  width: number;
  height: number;
};
export type MemeSeed = {
  photoGenerationId?: string;
  photoTemplate?: MemeTemplate;
  prompt: string;
  templateId: string;
  language: Language;
};
export type CaptionCandidate = MemeSeed & {
  generationId: string;
  caption: string;
  template: MemeTemplate;
};
export type MemeFeedItem = {
  id: string;
  title: string;
  body: string;
  location: string;
  created_at: string;
  scene: string;
  template: MemeTemplate;
  totals: VoteTotals;
  myVote: 1 | -1 | null;
  canReuse: boolean;
};

export type CaptionChoices = MemeSeed & { generationId: string; captions: string[]; template: MemeTemplate };
