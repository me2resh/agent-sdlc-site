# Edge redirects (D1): KeyValueStore lookup in the viewer-request function

- Status: accepted
- Date: 2026-09-27
- Ticket: #18 (with #32)
- Design: `docs/design/2026-09-25-standards-site-structure-technical-design.md`, section 4.3
- Maintainer decision: Q7, and the edge plan, in the 2026-09-26 comments on #18
- Review items applied: N2, N4, N5, and N6 from the design approval, and A2 from the PR 2a follow-up

## Summary

The three standards sites serve redirects at the edge. The viewer-request CloudFront Function looks up each path in a CloudFront KeyValueStore. Each environment has its own store. HTML stubs stay as the fallback.

This note is D1, step 1 of the edge plan on #18. It must exist before the I1 request goes to the infrastructure owner. PR 2b in this repository needs D1 and I1.

## Context

- S3 cannot send a 301 from a private bucket behind CloudFront. S3 website redirects need the S3 website endpoint. That endpoint does not work with Origin Access Control.
- One S3 bucket and one CloudFront distribution serve the three sites. Each site is under its own prefix. A viewer-request function selects the prefix from the host.
- The infrastructure is not in this repository. The infrastructure repository owns the function, the store, the error responses, and the deploy role.
- A missing object returns HTTP 403 today, not 404 (#32). Both the slash form and the no-slash form of a URL return 200 (#32).
- `config/redirects.ts` holds the redirect map. Each site build writes it to `dist/<site>/_redirects.json`.
- PR 2a (#37) added HTML stubs for old HTML pages. They are the file layer. They work without the edge layer.

## Options considered

The options and the reasons come from the design, section 8.3.

| Option | Pros | Cons | Result |
|--------|------|------|--------|
| KeyValueStore lookup in the current viewer-request function, with HTML stubs as the fallback | Real 301 and 302 for all file types. A normal PR in this repository changes the map. One redirect per request. | One infrastructure change, done together with #32. | Chosen |
| Map in the function code | No new AWS resource. | The function code limit is 10 KB. Each map change needs an infrastructure change. | Rejected |
| S3 website redirect metadata | No code. | Needs the S3 website endpoint, which does not work with Origin Access Control. | Rejected |
| Lambda@Edge | Full runtime. | Deploys in one fixed region. Higher cost and latency. More to operate. | Rejected |
| HTML meta-refresh stubs only | No infrastructure change. | HTTP 200, not 301. Does not work for JSON files. | Kept as the fallback only |

Smaller choices inside this decision:

| Choice | Options | Result | Reason |
|--------|---------|--------|--------|
| File detection in step 5 | A fixed list of file extensions, or "a dot in the last segment" | Fixed list | `/spec/1.2.0` has a dot but is a page. A dot rule maps it to an object that does not exist. |
| Store write in the production deploy (N5) | Write once after the three-site matrix, or write per site with a retry | One job after all three site deploys | Three parallel writes conflict on the store ETag. |
| Store write on staging | Keep it, or make the write production-only | Keep it, with the conditions from the design approval on #18 | The design approval kept the staging write. |
| Public `/_redirects.json` | Serve it as a static file, or do not upload it | Serve it as a normal public file | The file holds only public redirect data. A client sees the same data when it follows the redirects. |
| Old JSON schema copies | Remove them in PR 2b, or in their own PR | Their own PR | The removal can then be reverted alone. |
| 404 page (#32) | One shared page, or one page per site | One shared page first | Per-site pages can follow. |

## Decision

### Redirect store per environment

- Each environment has one CloudFront KeyValueStore: one for staging and one for production (Q7).
- Each key is `<site>|<normalized path>`. Each value holds the status code, the target, and the `Cache-Control` value.
- The map stays data in the store. It is not function code.

### Viewer-request function

The current viewer-request function gets the store. The function uses the CloudFront Functions JavaScript 2.0 runtime, because a KeyValueStore needs it. The function does these steps in this order:

1. **Select the site** from the `Host` header. An unknown host goes on as today.
2. **Normalize the path.** If the path is longer than `/`, remove all trailing slashes, not only one (N2). Record that the original path had a slash. Apply the open-redirect guard below.
3. **Look up** the key `<site>|<normalized path>` in the store. On a hit, return the stored code, the stored target as `Location`, and the stored `Cache-Control`. This is one redirect, also when the original path had a slash.
4. **Slash 301.** If the original path had a slash, return 301 to the normalized path on the same site. Use `Cache-Control: max-age=3600`.
5. **Rewrite** the request to the S3 prefix of the site. Use the file-extension rule below.

Function rules:

- The store lookup is in `try`/`catch`. On an error, the function continues to step 4 and step 5. This is "fail open". A lookup failure never blocks a real page.
- A redirect in step 2, 3, or 4 returns from the viewer-request function. It adds no origin request and no S3 read.
- The function copies no request value into `Location`. This includes the query string and all headers.
- The code stays small.

### Open-redirect guard (N2)

- When the normalized path starts with `//`, the function returns 404. This stops a protocol-relative `Location`.
- The function also rejects a path that starts with `/\`.
- The function builds an absolute `Location` for the slash 301. It takes the host from its own site table, not from the request `Host` header.
- The staging smoke test requests `//evil.example/`, `/\evil.example/`, and `/schemas//`.

### File-extension rule and the source list (A2)

- Step 5 treats the last path segment as a file only when it ends with an extension in a fixed list. A file keeps its path.
- Any other path maps to `<path>/index.html`. The root `/` maps to `/index.html`.
- The function does not treat "a dot in the last segment" as a file. So `/spec/1.2.0` maps to `spec/1.2.0/index.html`.
- **`edgeFileExtensions` in `config/redirects.ts` is the source list for the edge function.** This repository keeps no other copy of the list.
- Today the list has 14 entries: `.json`, `.md`, `.xml`, `.txt`, `.html`, `.png`, `.ico`, `.svg`, `.jpg`, `.webp`, `.css`, `.js`, `.woff2`, `.webmanifest`.
- `scripts/validate-routes.mjs` fails when a site build contains a file with an extension that is not in the list (N4).
- The edge function in the infrastructure repository keeps its own copy of the list. A change to the list starts in `config/redirects.ts`.
- The I1 change and PR 2b must each check that the two lists match. This is a standing risk until a mechanical check exists.

### Cache policy

- Each new 301 has `Cache-Control: max-age=3600`. This includes the slash 301.
- Each 302 has `Cache-Control: no-store`. The `/spec/latest` 302 always has `no-store`.
- The short cache limits the harm of a wrong 301, because a browser caches a 301 with no end date.
- After the first weeks, an entry can move to a longer `max-age`.
- The future `/interoperability` 301 on ORBIT and AgDR gets the same `max-age=3600` (Q12).

### Error responses: 403 and 404 (#32)

- The distribution maps a 403 and a 404 from the origin to a 404 response.
- One shared 404 page ships first. Per-site 404 pages can follow.
- After this change, a removed file returns 404, not 403 and not 200.

### Store writes

- The build writes `dist/<site>/_redirects.json`. A deploy workflow step writes the map into the store of its environment.
- In the production deploy, one job writes the store after all three site deploys. This avoids ETag conflicts (N5).
- The write uses `UpdateKeys`. It adds new keys before the S3 sync, and deletes old keys after it (N5).
- Staging: the write runs in the staging deploy that PR #33 moved to `workflow_run`. That workflow uses the build artifact from "Site checks". It does not check out pull request code. It runs only for a same-repository pull request.
- Production: the write runs only in the production workflow on `main`. A push to `main` or a manual dispatch starts it. Both need write access to this repository.
- The store ARN comes from an environment secret (N6).

Before each store write, trusted code from the `main` workflow file validates `_redirects.json`. It does not use code from the pull request artifact. The validation checks these items:

- Each key has a site prefix.
- Each target starts with one `/`, or with `https://` on one of the three canonical hosts.
- Each code is 301 or 302.
- Each `Cache-Control` value is from a fixed set.
- The map is within the store size limits.

On staging, the redirect steps run after the basic-auth check.

### Deploy-role limit

- The deploy role of an environment gets write access to the store of that environment only (Q7).
- The design lists these actions: `cloudfront-keyvaluestore:DescribeKeyValueStore`, `PutKey`, `DeleteKey`, and `ListKeys`.
- N5 adds `UpdateKeys` to the write step. I1 sets the final action list.

### Public map file

Each site keeps serving `/_redirects.json` as a normal public file.

### Rollout

1. **D1.** This note, in this repository.
2. **I1 and #32.** One change in the infrastructure repository. It adds one store per environment and the new viewer-request function with the N2 fixes. It maps a 403 and a 404 from the origin to a 404 response. It limits each deploy role to its own store. It goes to staging first. It goes to production after the smoke tests pass.
3. **PR 2b.** The workflows in this repository write the map into the store. A staging smoke test checks every redirect and the open-redirect paths.
4. **JSON copies.** A separate PR removes the old JSON schema copies.
5. **Q12.** Its own ticket, after the edge layer is live. It replaces `/interoperability` on ORBIT and AgDR with a 301 to agentsdlc.ai. Then it deletes `canonicalOwner`.

PR 2b also needs PR 4, PR 5, and PR 7, because they add the `pendingTargets` URLs. PR 2b can go first only with a recorded 404 exception. Until the target PR merges, a redirect to a `pendingTargets` URL returns 404.

## Consequences

- Old HTML and JSON URLs get a real 301 or 302 at the edge. A redirect costs no origin request.
- A normal PR in this repository changes the redirect map. A map change needs no infrastructure change.
- A change to the function, the store, the error responses, or the deploy role needs a change in the infrastructure repository.
- When the store lookup fails, real pages still load. Old URLs then get the HTML stub or a 404.
- The extension list exists in two repositories. A change must update both lists in step.
- On staging, two concurrent store writes can conflict. PR 2b states last-write-wins or uses one shared concurrency group.

## Open points (TBD)

- **Stored internal targets.** N2 asks for an absolute `Location` built from the site table. This note applies it to the slash 301. Whether a stored target that starts with `/` also becomes absolute is TBD in I1.
- **Order of the production store write.** N5 adds new keys before the S3 sync. The edge plan puts the one write job after all three site deploys. PR 2b must reconcile the two. TBD.
- **Staging concurrency.** Last-write-wins, or one shared concurrency group. PR 2b decides. TBD.
- **Longer 301 cache.** The design says "the first weeks". The length of the period and the longer `max-age` value are TBD.
- **Shared 404 page object.** Each site build contains `/404.html` today, from `apps/site/public/404.html`. The object that the 404 response serves is TBD in I1.
- **List comparison.** The method that checks that the function copy equals `edgeFileExtensions` is TBD.
- **Store size limits.** The validation checks the limits. The values come from the store service. This note records no number.
- **Platform review.** The design lists the Platform Engineer review of D1 and I1 as pending.

## Glossary

- **CloudFront Function**: a small JavaScript function that CloudFront runs at the edge for each request.
- **Viewer-request function**: a CloudFront Function that runs before CloudFront reads the cache or the origin.
- **KeyValueStore**: a CloudFront key-value data store that a CloudFront Function can read.
- **Redirect store**: in this note, the KeyValueStore that holds the redirect map of one environment.
- **Fail open**: on a store lookup error, the function serves the request from S3 and does not return an error.
- **Slash 301**: the 301 from the URL with a trailing slash to the same URL without it.
- **HTML stub**: a small HTML page at an old path. It has a meta refresh, a canonical link, `noindex`, and a visible link.
- **`pendingTargets`**: the list in `config/redirects.ts` of external targets that a later PR adds.
- **I1**: the one infrastructure change for the store, the function, and the deploy role. It includes the #32 work.

## References

- #18: the ticket, the design approval items (N1 to N6), and the maintainer decisions of 2026-09-26.
- #32: the 404 response and the slash 301.
- PR #34: the technical design.
- PR #37: the HTML stubs and the extension check (PR 2a).
- PR #33: the staging `workflow_run` deploy and the secrets model.
