# User discovery API

All endpoints below are mounted at `/api/users` and require the authenticated
`jwttoken` cookie, except for the existing public profile endpoint.

## Search users

`GET /api/users/search?q=maya`

- Searches `name` and `user_name` case-insensitively. A leading `@` is accepted.
- The query must be 2–80 characters; results are limited to 20 users.
- The signed-in user is excluded. Search results include users already followed.
- Returns only public profile fields, plus follow status and follower count.

```json
{
  "users": [
    {
      "_id": "user-id",
      "name": "Maya Rivera",
      "user_name": "maya",
      "profileImage": "https://example.com/profile.jpg",
      "bio": "A little bit of everything.",
      "followerCount": 8,
      "isFollowing": false,
      "mutualCount": 0,
      "reason": "Search result"
    }
  ]
}
```

## Recommendations

`GET /api/users/recommendations`

Returns up to 20 users not already followed, prioritizing accounts followed by
people the signed-in user follows. Remaining places are filled with accounts
ordered by follower count. Each result has the same shape as a search result;
`reason` identifies mutual connections or popular accounts.

## Follow and unfollow

- `POST /api/users/:id/follow` adds the target to the signed-in user's following list and updates the target's followers.
- `DELETE /api/users/:id/follow` removes both sides of that relationship.

Both endpoints return `{ "message": "...", "following": true|false }`.
