// src/constants/categoryIcons.ts
import { ImageSourcePropType } from "react-native";

export interface CategoryVisual {
  icon: ImageSourcePropType;
  bgColor: string;
  accentColor: string;
}

export const CATEGORY_MAP: Record<string, CategoryVisual> = {
  milk: {
    icon: require("../../assets/images/icons/milk.png"),
    bgColor: "#EAF4F4",
    accentColor: "#008080",
  },
  curd: {
    icon: require("../../assets/images/icons/curd.png"),
    bgColor: "#FFECE6",
    accentColor: "#E67E22",
  },
  dahi: {
    icon: require("../../assets/images/icons/curd.png"),
    bgColor: "#FFECE6",
    accentColor: "#E67E22",
  },
  ghee: {
    icon: require("../../assets/images/icons/ghee.png"),
    bgColor: "#FFF9E6",
    accentColor: "#D4AF37",
  },
  butter: {
    icon: require("../../assets/images/icons/butter.png"),
    bgColor: "#FFFBEB",
    accentColor: "#D97706",
  },
  paneer: {
    icon: require("../../assets/images/icons/paneer.png"),
    bgColor: "#F4F6F6",
    accentColor: "#4B5563",
  },
  cheese: {
    icon: require("../../assets/images/icons/cheese.png"),
    bgColor: "#FFF4E6",
    accentColor: "#EA580C",
  },
  icecream: {
    icon: require("../../assets/images/icons/ice-cream.png"),
    bgColor: "#FFF3E0",
    accentColor: "#F39C12",
  },
  lassi: {
    icon: require("../../assets/images/icons/lassi.png"),
    bgColor: "#F4E9F5",
    accentColor: "#8E44AD",
  },
  flavoredmilk: {
    icon: require("../../assets/images/icons/flavored-milk.png"),
    bgColor: "#FCE4EC",
    accentColor: "#C2185B",
  },
  flavouredmilk: {
    icon: require("../../assets/images/icons/flavored-milk.png"),
    bgColor: "#FCE4EC",
    accentColor: "#C2185B",
  },
  beverages: {
    icon: require("../../assets/images/icons/beverages.png"),
    bgColor: "#E3F2FD",
    accentColor: "#1E88E5",
  },
  drinks: {
    icon: require("../../assets/images/icons/beverages.png"),
    bgColor: "#E3F2FD",
    accentColor: "#1E88E5",
  },
};

export const normalizeCategoryKey = (name?: string): string => {
  if (!name) return "";
  return name.toLowerCase().trim().replace(/[\s_-]+/g, "");
};

export const getCategoryVisual = (name?: string): CategoryVisual | null => {
  const key = normalizeCategoryKey(name);
  return CATEGORY_MAP[key] || null;
};

export const getCategoryIcon = (name?: string): ImageSourcePropType | null => {
  const visual = getCategoryVisual(name);
  return visual ? visual.icon : null;
};

export default CATEGORY_MAP;
