import relativeLuminance from "relative-luminance";

export const isValidHex = (color: string) =>
  /^#([A-Fa-f0-9]{3}){1,2}$/.test(color);

export const hexToRgbArr = (hex: string): number[] => {
  let color;
  if (isValidHex(hex)) {
    color = hex.substring(1).split("");
    if (color.length === 3) {
      color = [color[0], color[0], color[1], color[1], color[2], color[2]];
    }
    color = "0x" + color.join("");
    return (
      /* eslint-disable */
      [(color >> 16) & 255, (color >> 8) & 255, color & 255]
      /* eslint-enable */
    );
  }
  return [0, 0, 0];
};

export const rgbToHex = (rgbArr: number[]): string => {
  const isValidRgbArr =
    rgbArr.length === 3 &&
    rgbArr.some(channel => channel > -1 && channel < 256);
  if (isValidRgbArr) {
    return rgbArr.reduce((acc, curr) => {
      let pair = Math.round(curr).toString(16);
      if (pair.length < 2) {
        pair = `0${pair}`;
      }
      acc += pair;

      return acc;
    }, "#");
  }
  return "#000000";
};

export const hexToRgbA = (hex: string, alpha: string | number = 1): string => {
  if (isValidHex(hex)) {
    return `rgba(${hexToRgbArr(hex).join(",")},${alpha})`;
  }
  return "rgba(0,0,0,0)";
};

const getLuminance = (luminanceVal1: number, luminanceVal2: number) => {
  const l1 = Math.max(luminanceVal1, luminanceVal2);
  const l2 = Math.min(luminanceVal1, luminanceVal2);

  // https://www.w3.org/TR/WCAG20/#contrast-ratiodef
  return (l1 + 0.05) / (l2 + 0.05);
};

// TODO: when/if we start using rgb/rgba colors in
// design-tokens, write getHexContrast function that can get
// rgb/rgba contrast as well
export const getHexContrast = (color1: string, color2: string) =>
  getLuminance(
    relativeLuminance(hexToRgbArr(color1)),
    relativeLuminance(hexToRgbArr(color2))
  );

// TODO: when/if we start using rgb/rgba colors in
// design-tokens, write getBrightness function that can get
// rgb/rgba brightness as well
const getHexBrightness = (hex: string) => {
  const rgbArr = hexToRgbArr(hex);
  return (rgbArr[0] * 299 + rgbArr[1] * 587 + rgbArr[2] * 114) / 1000;
};

export const isHexDark = (hex: string): boolean => getHexBrightness(hex) < 140;

// Normally this function would compare the contrast
// between the baseTextOption and invertedTextOption,
// but that forces text to be black on our success buttons.
//
// Checking with brightness still returns us the most readable
// option on the background color, but will let the success
// button have white text.
//
// The design team should try a different success color
// to improve legibility and accessibility.
export const pickReadableTextColor = (
  bgColor,
  baseTextOption,
  invertedTextOption
) => {
  const baseTextBrightness = getHexBrightness(baseTextOption);
  const invertedTextBrightness = getHexBrightness(invertedTextOption);

  if (!isHexDark(bgColor)) {
    return baseTextBrightness < invertedTextBrightness
      ? baseTextOption
      : invertedTextOption;
  }
  return baseTextBrightness > invertedTextBrightness
    ? baseTextOption
    : invertedTextOption;
};

/*
 * This function will select a WCAG-compliant text color based on the background color.
 * Reference: https://wunnle.com/dynamic-text-color-based-on-background
 * TODO: We should deprecate pickReadableTextColor and update components that use it.
 */
export const getTextColor = (
  bgColor,
  darkTextColor,
  lightTextColor
): string => {
  // Convert color from hex to RGB.
  const getRGB = (c: string | number): number => {
    return parseInt(c as string, 16) || (c as number);
  };

  // Convert to sRGB and apply gamma correction.
  const getsRGB = (c: string): number => {
    const rgb = getRGB(c) / 255;
    return rgb <= 0.03928 ? rgb / 12.92 : Math.pow((rgb + 0.055) / 1.055, 2.4);
  };

  // Calculate relative luminance.
  const getLuminance = (hexColor: string): number => {
    return (
      0.2126 * getsRGB(hexColor.slice(1, 3)) +
      0.7152 * getsRGB(hexColor.slice(3, 5)) +
      0.0722 * getsRGB(hexColor.slice(5, 7))
    );
  };

  // Use relative luminance to compare color contrast.
  const getContrast = (f: string, b: string): number => {
    const L1 = getLuminance(f);
    const L2 = getLuminance(b);
    // Ratio formula is defined by WCAG guidelines
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  };

  const LIGHT_COLOR = getContrast(bgColor, lightTextColor);
  const DARK_COLOR = getContrast(bgColor, darkTextColor);
  // Determine which color has the highest contrast ratio and return that color.
  return LIGHT_COLOR > DARK_COLOR ? lightTextColor : darkTextColor;
};

// Assumes we always want our default hover colors to be lower
// contrast between it's background color
export const pickHoverBg = (bgColor, baseHoverBg, invertedHoverBg) => {
  const baseHoverContrast = getHexContrast(bgColor, baseHoverBg);
  const invertedHoverContrast = getHexContrast(bgColor, invertedHoverBg);

  return baseHoverContrast > invertedHoverContrast
    ? invertedHoverBg
    : baseHoverBg;
};

export const mixHex = (color1, color2, percent) => {
  const color1rgb = hexToRgbArr(color1);
  const color2rgb = hexToRgbArr(color2);

  if (isValidHex(color1) && isValidHex(color2)) {
    const blendedRgbArr = color1rgb.map((_, i) =>
      Math.floor(color2rgb[i] + (color1rgb[i] - color2rgb[i]) * (percent / 100))
    );

    return rgbToHex(blendedRgbArr);
  }
  return isValidHex(color1) ? color1 : isValidHex(color2) ? color2 : "#000000";
};

// We lighten and darken our colors by tinting and shading, not
// by increasing brightness.
//
// Instead of requiring a full lighten/darken scale for each color
// when defining a theme, we can use these functions to extrapolate
// a lighten/darken scale from any color
export const lighten = (color: string, step: 1 | 2 | 3 | 4 | 5) => {
  const scale = [10, 20, 40, 80, 95];
  return mixHex("#FFFFFF", color, scale[step - 1]);
};

export const darken = (color: string, step: 1 | 2 | 3 | 4 | 5) => {
  const scale = [10, 20, 40, 60, 80];
  return mixHex("#000000", color, scale[step - 1]);
};
