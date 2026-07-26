---
title: Custom lighter addon
date_created: 06-22-2023
last_updated: 06-22-2023
description: The addon gives you the ability to set an item or a block with custom data to be used as a lighter, as a frame block or as an inside portal block (to replace the nether portal)
---

# Custom lighter addon

## What does it do?

{% hint style="info" %}
Supports [Oraxen](https://www.spigotmc.org/resources/%E2%9C%85-10-%E2%98%84%EF%B8%8F-oraxen-add-items-blocks-armors-hats-food-furnitures-plants-and-gui.72448/), [ItemsAdder ](https://www.spigotmc.org/resources/%E2%9C%A8itemsadder%E2%AD%90emotes-mobs-items-armors-hud-gui-emojis-blocks-wings-hats-liquids.73355/)& [CustomItems](https://www.spigotmc.org/resources/%E2%9B%8F-custom-items-%E2%9C%85-1-19-ready-%E2%9C%85-make-new-items-blocks-with-new-textures-recipes-events-actions.63848/)
{% endhint %}

The addon gives you the ability to set an item or a block with custom data to be used as a lighter, as a frame block or as an inside portal block (to replace the nether portal)

## How is it configured?

```yaml
Addon:
  CustomLighter:
    Item:
      - "<plugin>:<item>"
    FrameBlock: "<plugin>:<block>"
    InsideBlock: "<plugin>:<block>"
```

Setting a custom item/block that is from minecraft its recommended to use the "**/dim setLighter \<portal>",** "**/dim setFrameBlock \<portal>" ,**"**/dim setInsideBlock \<portal>"** commands.

If you use ItemsAdder or Oraxen plugin, you can set the custom items by using **ITEMSADDER:\<itemid>,** **ORAXEN:\<itemid> or CUSTOMITEMS:\<itemid>.**

Note that after changing the custom item/blocks you need to restart the server.
