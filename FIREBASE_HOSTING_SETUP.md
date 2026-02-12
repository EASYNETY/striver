# Firebase Hosting Setup Guide

## Two Separate Sites

This project uses TWO Firebase hosting sites:

1. **Admin Dashboard** (Private)
   - Site: `striver-app-48562`
   - URL: `https://striver-app-48562.web.app`
   - Content: Admin panel React app
   - Target: `admin`

2. **Deep Links** (Public)
   - Site: `striver-links`
   - URL: `https://striver-links.web.app`
   - Content: Branded redirect page for app deep links
   - Target: `links`

## Setup Commands

### First Time Setup

1. Create the deep links site:
```bash
firebase hosting:sites:create striver-links
```

2. Configure the targets:
```bash
firebase target:apply hosting admin striver-app-48562
firebase target:apply hosting links striver-links
```

### Deployment

Deploy both sites:
```bash
firebase deploy --only hosting
```

Deploy only admin dashboard:
```bash
firebase deploy --only hosting:admin
```

Deploy only deep links:
```bash
firebase deploy --only hosting:links
```

## After Setup

Update all deep link URLs in the app code to use:
`https://striver-links.web.app` instead of `https://striver-app-48562.web.app`
