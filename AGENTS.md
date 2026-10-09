<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Fund matching is deterministic and runs in the app (src/lib/matching.ts) over the public.funds table, covered by src/test/matching.test.ts — instant, explainable results with no AI cost; AI is only used for the chat and the unverified web search.
- Part 5 (situation) answers live in sessionStorage only (loadSituation/storeSituation), never in the database.
