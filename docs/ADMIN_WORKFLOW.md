# HC Admin Workflow

Site: AMONguyen
Production branch: main

## Owner flow
1. Open /editor.html
2. Pages CMS: structured content, media, section ordering.
3. /admin/visual.html: drag and drop visual editing.
4. Save Draft does not change production.
5. Export HTML creates a review artifact.

## Safety
- main is production.
- Visual Builder never overwrites index.html automatically.
- Publish must preserve existing runtime scripts and config.
- GitHub Pages remains deployment target.
