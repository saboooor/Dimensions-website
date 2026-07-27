import type { PresetDefinition } from "./types";
import { PresetIconComponents, ShapeIconComponents } from "./shapes";
import Circle from "lucide-icons-qwik/icons/Circle";

export const Presets = {
  definitions: {
    "Green Spiral": {
      description: "Spiraling pattern around the portal",
      icon: "tornado",
      accentColor: "#00ff66",
      frequency: 20,
      layers: [
        {
          name: "Green Spiral",
          enabled: true,
          section: "portal",
          particle: {
            type: "REDSTONE",
            color: { r: 0, g: 255, b: 0 },
            size: 2,
          },
          shape: {
            type: "spiral",
            params: { radius: 1.2, turns: 2, density: 30, speed: 1.0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: true, rotateSpeed: 1.0, float: false },
        },
      ],
    },
    "Pink Ring": {
      description: "Ring of particles at the portal center",
      icon: "circle",
      accentColor: "#ff66ff",
      frequency: 5,
      layers: [
        {
          name: "Pink Ring",
          enabled: true,
          section: "portal",
          particle: {
            type: "REDSTONE",
            color: { r: 255, g: 100, b: 255 },
            size: 1.5,
          },
          shape: {
            type: "ring",
            params: { radius: 1.5, density: 20, speed: 0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: false, rotateSpeed: 0, float: false },
        },
      ],
    },
    "Red-Blue Helix": {
      description: "Double helix with two colors",
      icon: "infinity",
      accentColor: "#ff3344",
      frequency: 15,
      layers: [
        {
          name: "Red Strand",
          enabled: true,
          section: "portal",
          particle: {
            type: "REDSTONE",
            color: { r: 255, g: 50, b: 50 },
            size: 1,
          },
          shape: {
            type: "spiral",
            params: { radius: 1.0, turns: 3, density: 20, speed: 1.0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: true, rotateSpeed: 1.0, float: false },
        },
        {
          name: "Blue Strand",
          enabled: true,
          section: "portal",
          particle: {
            type: "REDSTONE",
            color: { r: 50, g: 50, b: 255 },
            size: 1,
          },
          shape: {
            type: "spiral",
            params: { radius: 1.0, turns: 3, density: 20, speed: 1.0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: true, rotateSpeed: 1.0, float: false },
        },
      ],
    },
    "Purple Vortex": {
      description: "Particles spiraling inward",
      icon: "bullseye",
      accentColor: "#cc00ff",
      frequency: 10,
      layers: [
        {
          name: "Purple Vortex",
          enabled: true,
          section: "portal",
          particle: {
            type: "REDSTONE",
            color: { r: 180, g: 50, b: 255 },
            size: 1.5,
          },
          shape: {
            type: "vortex",
            params: { maxRadius: 1.5, density: 30, twistFactor: 3, speed: 1.0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: true, rotateSpeed: 1.0, float: false },
        },
      ],
    },
    "Blue Rain": {
      description: "Particles falling like rain",
      icon: "cloud-rain",
      accentColor: "#64b4ff",
      frequency: 10,
      layers: [
        {
          name: "Blue Rain",
          enabled: true,
          section: "portal",
          particle: {
            type: "REDSTONE",
            color: { r: 100, g: 180, b: 255 },
            size: 1,
          },
          shape: {
            type: "rain",
            params: { density: 15, spread: 1.5, speed: 1.0 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: false, rotateSpeed: 0, float: false },
        },
      ],
    },
    "Flame Border": {
      description: "Flames on each portal tile",
      icon: "fire",
      accentColor: "#ff8800",
      frequency: 5,
      layers: [
        {
          name: "Flames",
          enabled: true,
          section: "tile",
          particle: { type: "FLAME", color: { r: 255, g: 140, b: 0 }, size: 1 },
          shape: { type: "border", params: { offsetRange: 0.05 } },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: false, rotateSpeed: 0, float: false },
        },
      ],
    },
    "Enchant Glow": {
      description: "Enchantment particles floating",
      icon: "stars",
      accentColor: "#66ff66",
      frequency: 8,
      layers: [
        {
          name: "Enchant",
          enabled: true,
          section: "portal",
          particle: {
            type: "ENCHANTMENT_TABLE",
            color: { r: 100, g: 255, b: 100 },
            size: 1,
          },
          shape: {
            type: "random",
            params: { count: 12, spread: 1.0, seed: 42 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: false, rotateSpeed: 0, float: true },
        },
      ],
    },
    Fireflies: {
      description: "Floating fireflies around portal",
      icon: "stars",
      accentColor: "#ffdd44",
      frequency: 12,
      layers: [
        {
          id: "layer-fireflies-1",
          name: "Fireflies",
          enabled: true,
          section: "portal",
          particle: {
            type: "REDSTONE",
            color: { r: 255, g: 220, b: 50 },
            size: 1.2,
          },
          shape: {
            type: "random",
            params: { count: 20, spread: 1.5, seed: 101 },
          },
          position: { x: 0, y: 0, z: 0 },
          animation: { rotate: false, rotateSpeed: 0, float: true },
        },
      ],
    },
    Empty: {
      description: "Start from scratch",
      icon: "plus-circle",
      accentColor: "#555570",
      frequency: 20,
      layers: [],
    },
  } as Record<string, PresetDefinition>,
};
