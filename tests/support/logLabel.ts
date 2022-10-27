import type { ColorName } from "chalk";

import chalk from "chalk";

const PADDING_WIDTH = 12;

// The order here is important, we want successive prefixes to have
// high contrast.
const availableColors: ColorName[] = [
  "blue",
  "yellowBright",
  "greenBright",
  "gray",
  "green",
  "blueBright",
  "redBright",
  "white",
  "yellow",
  "red",
  "magenta",
  "cyan",
];

const assignedColors: Record<string, ColorName> = {};

export function make(label: string): string {
  if (assignedColors[label] === undefined) {
    const color = availableColors.pop();
    if (!color) {
      throw new Error("We're out of colors. 🤷");
    }

    assignedColors[label] = color;
  }

  // We reset colors at the beginning of each line to avoid styles from previous
  // lines messing up prefix colors. This is noticable in rust stack traces
  // where the `in` and `with` keywords have a white background color.
  return chalk.reset[assignedColors[label]](
    `${label.padEnd(PADDING_WIDTH)} | `,
  );
}
