# PONYTAIL: Minimalist & Anti-Overengineering Rule

Before writing code, stop at the first rung that holds:
1. **Does this need to exist?** -> No: Skip it (YAGNI).
2. **Already in this codebase?** -> Reuse it, don't rewrite.
3. **Standard library does it?** -> Use it.
4. **Native platform feature?** -> Use it (e.g. native HTML `<input type="date">`, CSS Flexbox/Grid, React Native core components).
5. **Installed dependency?** -> Use what's already in `package.json` before installing new packages.
6. **One line?** -> Keep it to one clean line instead of 50 lines of boilerplate wrapper.
7. **Only then:** The minimum that works.

### Safety & Integrity Rules
- Never cut validation at trust boundaries.
- Never cut error handling or recovery.
- Never cut security, RLS policies, or authentication checks.
- Never sacrifice accessibility or responsive UX.
- Lazy about the solution, never about reading the codebase.
