import type {Language} from '../i18n';
import type {CatBreed,CatStyle} from '../rants/cat-options';
import type {VoteTotals} from '../rants/types';
export type CatFilters={sort:'latest'|'popular';window:'week'|'month'|'year'|'all';page:number};
export type CatSeed={prompt:string;breed:CatBreed;style:CatStyle;language:Language};
export type CatFeedItem={id:string;title:string;body:string;location:string;created_at:string;ai_image_path:string;breed:CatBreed;style:CatStyle;totals:VoteTotals;myVote:1|-1|null;canReuse:boolean;imageUrl:string|null;imageError:boolean};
