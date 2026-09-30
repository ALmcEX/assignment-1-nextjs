import { isProfileComplete, type Profile } from "./profile";

export function getPostAuthPath(profile: Profile): "/profile" | "/dashboard" {
  return isProfileComplete(profile) ? "/dashboard" : "/profile";
}
