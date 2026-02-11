export enum EHeader {
  BASE = "base", // (top + bot (menu), prime backg) - dest | nav | social + search
  BASE_COMPACT = "base-compact", // (top + bot (no menu), prime backg) - dest | nav | social + search
  TRANSPARENT = "transparent", // (top, transparent backg) - logo | nav | social + search. TODO: add socials + search
  CENTERED = "centered", // (top, transparent back) - dest | nav + logo | social + search
  FULL = "full", // (top, white backg, full width) - dest | nav + logo | social + search
  FULL_MINIMAL = "full-minimal", // (top, white backg, full width) - logo | nav
}
