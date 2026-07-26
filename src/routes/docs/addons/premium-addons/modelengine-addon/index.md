---
title: ModelEngine addon
date_created: 08-14-2022
last_updated: 08-14-2022
description: Summon entities with custom models inside the portal
---

# ModelEngine addon (BETA)

{% hint style="warning" %}
The addon is in BETA stages. Stuff will be added/removed in almost every update
{% endhint %}

## What does it do?

This addon allows you to summon entities with custom models inside the portal

{% hint style="info" %}
Requires [ModelEngine](https://www.spigotmc.org/resources/conxeptworks-model-engine%E2%80%94ultimate-custom-entity-model-manager-1-16-5-1-19-2.79477/) 2.5.3
{% endhint %}

{% hint style="danger" %}
**I**f you reload the server and there are spawned models, the models will stay there and won't be removable (unless you use commands to force remove them)
{% endhint %}

## How is it configured?

```yaml
Addon:
  ModelEngine: #This list will run for every portal entity inside the portal. so when you check (%y%==%minY%) you check if the model will spawn at the bottom of the portal
    # - '<boolean>;<modelName>;<x>,<y>,<z>'
    # Example 1: spawn kindletronjr model inside the outline of the portal
    # - '(%y%==%minY% || %y%==%maxY%) || ((%x%==%minX% || %x%==%maxX%) && (%z%==%minZ% || %z%==%maxZ%));kindletronjr;%x%,%y%,%z%'
    # Example 2: Spawn kindletronjr at the center of the portal
    # - 'once;kindletronjr;%centerX%,%centerY%,%centerZ%'
```

{% hint style="info" %}
You can use the keyword 'once' in order to only summon the model once at the specified location.

You can use 'DEBBUGER' to debug the first argument

You can use simple mathematical operations for the spawn location
{% endhint %}

```
Placeholders:
%entity% - Player name/Entity Type

%destinationWorld% - Destination world
%destinationX% - Destination X
%destinationY% - Destination Y
%destinationZ% - Destination Z

%originalWorld% - Original world
%x% - Original X
%y% - Original Y
%z% - Original Z

%zAxis% - True if portal is Facing the X Axis (aka portal is build along the Z Axis

%minX% - Minimum X of the portals inside
%minY% - Minimum Y of the portals inside
%minZ% - Minimum Z of the portals inside

%maxX% - Maximum X of the portals inside
%maxY% - Maximum Y of the portals inside
%maxZ% - Maximum Z of the portals inside

%centerX% - Portal center X
%centerY% - Portal center Y
%centerZ% - Portal center Z

%portalWidth% - Portal width
%portalHeight% - Portal height

The addon also supports PlaceholderAPI placeholders
```
