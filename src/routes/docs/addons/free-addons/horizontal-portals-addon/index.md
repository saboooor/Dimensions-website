---
title: Horizontal portals addon
date_created: 08-07-2022
last_updated: 08-07-2022
description: Gives you the option to make horizontal portals
---

# Horizontal portals addon

## What does it do?

It gives you the option to make horizontal portals

{% hint style="danger" %}
Horizontal portals do not work custom blocks as frame. (custom portal inside and lighter works fine)
{% endhint %}

## How is it configured?

```yaml
Addon:
  HorizontalPortal: "<input>"
```

You can use "false", "true" and "both"

- false: no horizontal portal
- true: the portal is now horizontal
- both: this portal can be built as vertical and as horizontal and they can link with each other
