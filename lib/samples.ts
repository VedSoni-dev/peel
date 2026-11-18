// Six real products, saved from Open Food Facts (ODbL) on 2026-11-17, so "Try a sample" works offline and never waits
// on OFF's rate limit. The app labels them as samples.
import type { Product } from "./score";
import data from "./samples.json";

export const SAMPLES = data as Product[];
