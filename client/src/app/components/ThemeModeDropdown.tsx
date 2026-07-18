import { useEffect, useRef, useState } from "react";
import { useTheme } from "../providers/useTheme";
import type { Theme } from "../providers/ThemeContext";
import styles from "./ThemeModeDropdown.module.css";

const THEME_OPTIONS: Array<{ value: Theme; label: string; emoji: string }> = [
  { value: "light", label: "Light", emoji: "☀️" },
  { value: "dark", label: "Dark", emoji: "🌙" },
  { value: "retro", label: "Retro", emoji: "💾" },
];

export function ThemeModeDropdown() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const activeOption = THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[1];

  return (
    <div
      className={styles.splitButton}
      ref={dropdownRef}
      onBlur={(event) => {
        if (!dropdownRef.current?.contains(event.relatedTarget as Node)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        className={styles.themeButton}
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Choose visual theme"
        title="Choose visual theme"
      >
        <span className={styles.themeEmoji} aria-hidden="true">
          {activeOption.emoji}
        </span>
        <span>{activeOption.label}</span>
      </button>
      <button
        type="button"
        className={styles.themeChevron}
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Open theme menu"
        title="Open theme menu"
      >
        ▾
      </button>
      {isOpen && (
        <ul className={styles.dropdownMenu} role="listbox" aria-label="Visual theme">
          {THEME_OPTIONS.map((option) => (
            <li
              key={option.value}
              className={styles.dropdownItem}
              role="option"
              aria-selected={option.value === theme}
              tabIndex={0}
              onClick={() => {
                setTheme(option.value);
                setIsOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setTheme(option.value);
                  setIsOpen(false);
                }
              }}
            >
              <span aria-hidden="true">{option.emoji}</span>
              <span>{option.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
