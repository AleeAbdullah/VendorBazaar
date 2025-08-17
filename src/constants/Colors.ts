export interface ColorPalette {
  background: string;
  input: string;

  card: string;
  text: string;
  secondaryText: string;
  tertiaryText: string;
  placeholder: string;
  border: string;
  accent: string;
  headerBackground: string;
  headerText: string;
}

export const lightColors: ColorPalette = {
  background: "#f4f4f5",
  input: "#3f3f46",
  card: "#ffffff",
  text: "#18181b",
  secondaryText: "#71717a",
  tertiaryText: "#a1a1aa",
  placeholder: "#a1a1aa",
  border: "#e4e4e7",
  accent: "#557754",
  headerBackground: "#ffffff",
  headerText: "#18181b",
};

export const darkColors: ColorPalette = {
  background: "#27272a",
  input: "#343438",
  card: "#3f3f46",
  text: "#f4f4f5",
  secondaryText: "#d4d4d8",
  tertiaryText: "#a1a1aa",
  placeholder: "#71717a",
  border: "#4b5563",
  accent: "#557754",
  headerBackground: "#3f3f46",
  headerText: "#f4f4f5",
};
