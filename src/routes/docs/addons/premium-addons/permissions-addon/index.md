---
title: Permissions addon
date_created: 07-23-2022
last_updated: 07-23-2022
description: Set permissions for each portal
---

# Permissions addon

## What does it do?

You can set permissions for each portal using this addon. Players that do not have permissions will not be able to ignite or use the portal.

## How is it configured?

```yaml
Addon:
  Permission:
    Node: "<input1>"
    DenyMessage: "<input2>"
```

- \<input1> = 'none' to disable or any string text you want to be the permission (e.x dimensions.useportal.samplePortal)
- \<input2> = any string text you want to be shown to the player if they dont have permission
