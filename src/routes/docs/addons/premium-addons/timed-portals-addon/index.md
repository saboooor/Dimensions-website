---
title: Timed portals addon
date_created: 08-07-2022
last_updated: 08-07-2022
description: Portals will auto-destruct after a configured time of being lit.
---

# Timed portals addon

## What does it do?

Portals will auto-destruct after a configured time of being lit.

## How is it configured?

```yaml
Addon:
  TimedPortals:
    DestroyAfterMillis: <input1>
    Action: "<input2>"
    Effects: #input3
      - "[millis]->[particle pack]"
```

- input1: any integer above zero (0) that indicates how many milliseconds this portal will be activated before being destroyed
- input2: you can use between 'Close' or 'Destroy'. **Close** will just break the portal like you would if you attacked the inside of it and **Destroy** will also remove the frame blocks. You can also add {explode%\<integer 0-100>} if you want the portal to explode. The integer after the **%** are the chances of the portal exploding.
- input3: here you must list all the effects you want to play (from the [ParticlesAddon](/docs/addons/premium-addons/particles-addon)) and the delay for every effect.

Effects Example:

```
  Effects:
#   - '[milliseconds after ignite]->[particle pack name]'
    - '1000->timer1'
    - '2000->timer1'
    - '3000->timer1'
    - '4000->timer1'
    - '5000->timer2'
    - '5500->timer3'
```
