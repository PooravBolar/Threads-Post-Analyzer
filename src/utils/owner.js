/**
 * Owner config: only the owner (Poorav Bolar) can add viral posts.
 * Set VITE_OWNER_EMAIL and VITE_OWNER_UID in .env to your Firebase auth email and UID.
 */

const OWNER_EMAIL = (import.meta.env.VITE_OWNER_EMAIL || '').trim().toLowerCase();
const OWNER_UID = (import.meta.env.VITE_OWNER_UID || '').trim();

export const isOwner = (user) => {
  if (!user?.email) return false;
  return user.email.trim().toLowerCase() === OWNER_EMAIL;
};

export const getOwnerUid = () => OWNER_UID || null;
