export const catBreeds = ['orange', 'tabby', 'ragdoll', 'british', 'tuxedo', 'calico'] as const;
export const catStyles = ['photo', 'illustration', 'clay'] as const;
export type CatBreed = typeof catBreeds[number];
export type CatStyle = typeof catStyles[number];
export const breedPrompts: Record<CatBreed, string> = {
 orange: 'a fluffy orange cat', tabby: 'a brown striped tabby cat', ragdoll: 'a blue-eyed ragdoll cat',
 british: 'a round-faced British shorthair cat', tuxedo: 'a black-and-white tuxedo cat', calico: 'a tricolor calico cat',
};
export const stylePrompts: Record<CatStyle, string> = {
 photo: 'warm, natural-light photography', illustration: 'a playful hand-drawn illustration with soft colors', clay: 'a charming handmade clay miniature',
};
