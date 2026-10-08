import type { Profile } from "./profile";

// Keep the callback's validated profile argument, but make completion optional.
export function getPostAuthPath(profile: Profile): "/" {
  void profile;
  return "/";
}
