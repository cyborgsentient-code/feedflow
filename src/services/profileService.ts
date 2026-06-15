/** Backward-compatible barrel — consumers that imported profileService continue to work.
 *  New code should import directly from the split services. */
export { profileReadService as profileService } from "./profile/profileReadService";
export { profileReadService } from "./profile/profileReadService";
export { profileWriteService } from "./profile/profileWriteService";
export { onboardingService } from "./profile/onboardingService";
