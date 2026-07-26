---
title: Random location addon
date_created: 08-08-2022
last_updated: 08-08-2022
description: Gives the chance to spawn portals at a random range away from the location it would normally spawn
---

# Random location addon

## What does it do?

The addon will give you the chance to spawn portals at a random range away from the location it would normally spawn. Why would you want to use this? Well, you will find something ;)

## How is it configured?

```yaml
Addon:
  RandomLocation:
    Range: "<input>"
    AllowLinkTp: "<input2>"
```

\<input> = any number

\<input2> = 'false' if you want to override linked portals and always random tp
