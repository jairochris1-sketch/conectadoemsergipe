

## Plan: Lightbox Close Fix, Comment Deletion, "Top" Reactions & Asaas Payment Integration

### 1. Fix Lightbox Close Button (mobile + desktop)
**File:** `src/components/PostFeed.tsx`
- The close button (✕) at line 486-490 is positioned `absolute top-3 right-3` on the overlay, but can be hard to tap on mobile. Move it inside the modal container and increase its tap target size.
- Ensure clicking the dark overlay also closes the lightbox (already works at line 483).

### 2. Comment Deletion
**Files:** `src/context/SocialContext.tsx`, `src/components/PostFeed.tsx`
- Add `deleteComment(commentId: string, postId: string)` to `SocialContext` that deletes from the `comments` table where `user_id = current user` (or admin can delete any).
- In `PostFeed.tsx`, add a small trash icon button next to each comment the current user authored (and for admins on all comments).
- In the lightbox comment list, add the same delete button.
- After deletion, re-fetch comments for that post.

### 3. "Top" Reaction Button (Like/React to Posts)
**Database migration:**
- Create `post_reactions` table: `id uuid PK`, `post_id uuid NOT NULL`, `user_id uuid NOT NULL`, `created_at timestamptz DEFAULT now()`, `UNIQUE(post_id, user_id)`.
- Enable RLS: authenticated users can insert/delete their own, everyone can select.

**Files:** `src/components/PostFeed.tsx`, `src/context/SocialContext.tsx`
- Add a "🔝 Top" button below each post (next to the comments toggle).
- On click, insert into `post_reactions` (or delete if already reacted = toggle).
- Show reaction count next to the button.
- Fetch reaction counts and user's own reactions in batch when loading posts.
- Also show the Top button in the lightbox view.

### 4. Asaas Payment Integration — Assessment

Integrating with Asaas (Brazilian payment gateway) requires:
- An API key from the user
- Edge functions to call Asaas API endpoints (create customer, create payment/charge, handle webhooks)
- Database tables for tracking payment status

**Recommendation:** This is a good time to start the payment foundation. The plan:
- Create an edge function `asaas-payment` that proxies requests to Asaas API
- Request the Asaas API key as a secret
- Create a `payments` table to track transactions
- Add a "Comprar créditos" page where sellers can purchase ad credits via Asaas (PIX, boleto, credit card)
- Connect to the existing `ad_credits` system for boosting products and premium store plans

### Summary of Changes

| Area | Files Modified/Created |
|------|----------------------|
| Lightbox close | `PostFeed.tsx` |
| Comment deletion | `SocialContext.tsx`, `PostFeed.tsx` |
| Top reactions | Migration (new table), `PostFeed.tsx` |
| Asaas payments | Edge function, secret config, new page, migration |

