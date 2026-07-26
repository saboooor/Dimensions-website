---
title: DayLightSensor addon
date_created: 07-23-2022
last_updated: 07-23-2022
description: Make portals only be activatable during a specific time of day (in game).
---

# DayLightSensor addon

## What does it do?

This addons gives you the ability to make portals only be activatable during a specific time of day (in game).

## How is it configured?

```yaml
Addon:
  DayLightSensor:
    StartAllow: "<input1>"
    StopAllow: "<input2>"
    DenyMessage: "<input3>"
```

- \<input1> = any integer
- \<input2> = any integer
- \<input3> = any string text you want to be shown to the player if the time is not in range

{% hint style="info" %}
You can set **StartAllow** to the time you want the portals to start being able to be ignited and you can set **StopAllow** to the time you want the portals to stop being able to be ignited.\
If you set **StartAllow** to a higher integer than **StopAllow** then the portals will be able to be ignited after X & then before Y the next day.
{% endhint %}

{% hint style="info" %}
NOTE: setting the same time to min and max disables the addon
{% endhint %}
