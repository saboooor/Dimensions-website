---
title: Third party addons
date_created: 07-23-2022
last_updated: 07-23-2022
description: Addons made by other developers
---

# Limited uses addon

## What does it do?

The portal can be set to auto-destruct after being used too many times.

## How is it configured?

```yaml
Addon:
  LimitedUses:
    MaxUses: <input1>
    Action: "<input2>"
```

- input1: any integer above zero (0) that indicates how many times this portal can be used by any player in order to be destroyed
- input2: you can use between 'Close' or 'Destroy'. **Close** will just break the portal like you would if you attacked the inside of it and **Destroy** will also remove the frame blocks. You can also add {explode%\<integer 0-100>} if you want the portal to explode. The integer after the **%** are the chances of the portal exploding.
