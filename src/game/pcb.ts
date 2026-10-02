export type PcbLook = {
  name: string;
  line: string;
  mask: string;
  copper: string;
  chip: string;
  ink: string;
  maskN: number;
  copperN: number;
  chipN: number;
  inkN: number;
};

function look(
  name: string,
  line: string,
  mask: string,
  copper: string,
  chip: string,
  ink: string,
): PcbLook {
  const n = (hex: string) => Number.parseInt(hex.slice(1), 16);
  return { name, line, mask, copper, chip, ink, maskN: n(mask), copperN: n(copper), chipN: n(chip), inkN: n(ink) };
}

/** Real part colors. Not the menu lime. */
export function pcbLook(id: string): PcbLook {
  if (id === "practice-2d" || id === "practice-3d") {
    return look("Practice", "Learn the controls. The real boards come after.", "#145c28", "#f0d060", "#12301c", "#06110c");
  }
  if (id === "oil-pan") {
    return look("RAM", "A memory stick. Fast. Empty when the power goes.", "#0c3d16", "#f0d060", "#161616", "#07080a");
  }
  if (id === "around-the-bend" || id === "dark-bay") {
    return look("SSD", "Flash chips. They keep the bits with the power off.", "#141414", "#d4af37", "#2c2c2c", "#07080a");
  }
  if (id === "pit-drop") {
    return look("GPU", "A graphics card. Many small cores, one picture.", "#101610", "#c9a227", "#1c1c1c", "#07080a");
  }
  if (id === "blade-walk" || id === "packet-lane" || id === "signal-hop") {
    return look("Network card", "Packets leave on the copper.", "#0b4a28", "#e0b050", "#08301a", "#06110c");
  }
  if (id === "saw-line" || id === "heat-sink") {
    return look("CPU", "The metal lid is the heat spreader.", "#8d9390", "#b87333", "#c5c9c4", "#121416");
  }
  if (id === "mind-the-pit") {
    return look("Power supply", "Yellow is the 12 volt rail.", "#2c3136", "#f2c14e", "#3e444c", "#101214");
  }
  if (id === "crew-gate" || id === "case-fan") {
    return look("Cooler", "Fins dump heat into the air.", "#8d9398", "#b87333", "#d5d8dc", "#121416");
  }
  if (id === "slick-shelf" || id === "shop-exit") {
    return look("The board", "The operating system sits on this hardware.", "#0e4a22", "#d7a441", "#141414", "#06110c");
  }
  return look("Motherboard", "Green mask. Gold traces. Black chips.", "#0e4a22", "#d7a441", "#161616", "#06110c");
}
