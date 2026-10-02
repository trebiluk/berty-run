export type GuideTopic = {
  id: string;
  unit: string;
  title: string;
  hook: string;
  body: string[];
  checks: { prompt: string; choices: string[]; answer: number }[];
};

export const GUIDE: GuideTopic[] = [
  {
    id: "keys",
    unit: "Use it",
    title: "Kinds of keys",
    hook: "The letter on a key is paint. The key sends a code.",
    body: [
      "A keyboard is a field of switches. Press one and it sends a number. The computer looks that number up and decides it was the K key, or Shift, or Escape.",
      "Letter and number keys type. Modifier keys — Shift, Ctrl, Alt, and the Command key on some laptops — change another key. Alone, they usually do nothing.",
      "Function keys, F1 through F12, are blank on purpose. Each program picks what they do. Arrow keys, Home, End, and Page Up move a cursor. Enter confirms. Tab jumps to the next box. Escape backs out.",
      "Caps Lock and Num Lock stay on until you press them again. They are toggles, not taps. That is why a whole sentence can come out in capitals.",
    ],
    checks: [
      {
        prompt: "What does a modifier key like Shift do?",
        choices: ["It changes another key", "It cools the CPU", "It stores files", "It raises the refresh rate"],
        answer: 0,
      },
      {
        prompt: "Escape usually",
        choices: ["backs you out", "erases the drive", "turns the PC off", "speeds up RAM"],
        answer: 0,
      },
    ],
  },
  {
    id: "switches",
    unit: "Use it",
    title: "Why some keys click",
    hook: "The sound is the switch under the key, not a speaker.",
    body: [
      "A membrane keyboard has one rubber sheet. It is quiet, soft, and cheap. Most school keyboards are membrane.",
      "A mechanical keyboard gives every key its own switch. Clicky switches, often called Blue, have a small bar that clicks. You hear that bar. Tactile switches, often called Brown, have a bump you feel and little sound. Linear switches, often called Red, are smooth: no bump, and quieter.",
      "Silent switches add pads so the plastic stem does not slap the bottom. The key still works. It just does not announce itself.",
      "Louder is not faster. Sound is a choice about the room. In a class, a quiet switch is kinder to the person next to you.",
    ],
    checks: [
      {
        prompt: "The click of a loud keyboard comes from",
        choices: ["a bar inside the switch", "the PC speaker", "the case fan", "the monitor"],
        answer: 0,
      },
      {
        prompt: "A linear switch feels",
        choices: ["smooth, with no bump", "like it must click to work", "hot", "only sticky when the PC is off"],
        answer: 0,
      },
    ],
  },
  {
    id: "ram-speed",
    unit: "How it works",
    title: "RAM speed",
    hook: "RAM is the desk. Turn the PC off and the desk is cleared.",
    body: [
      "The CPU reads and writes RAM all the time. Capacity, like 8 GB or 16 GB, is how much can sit on the desk at once. Speed is how fast a note can be handed over.",
      "Speed is written as MT/s, millions of transfers a second. People still say MHz. DDR4-3200 moves more data per second than DDR4-2400. DDR means double data rate: one transfer as the clock rises, one as it falls.",
      "Faster only counts if the CPU and the motherboard allow that speed. A kit that is 'faster' on the box can quietly drop down to a slower speed the board supports.",
      "Latency, the CL number, is how many clocks RAM waits before it answers. Lower CL answers sooner. If you are running out of room, more gigabytes helps more than a small speed bump.",
    ],
    checks: [
      {
        prompt: "When you turn the PC off, RAM",
        choices: ["forgets", "keeps your files", "becomes the SSD", "gets louder"],
        answer: 0,
      },
      {
        prompt: "DDR means",
        choices: ["two transfers each clock", "two fans", "double the screen", "a kind of key switch"],
        answer: 0,
      },
    ],
  },
  {
    id: "amd-intel",
    unit: "How it works",
    title: "AMD and Intel",
    hook: "Both make CPUs. The logo is not the spec.",
    body: [
      "AMD and Intel design the chips that run Windows, most games, and this browser. A program does not care about the logo. It cares that the chip speaks the same instructions.",
      "The socket does care. An AMD chip does not drop into an Intel motherboard. The pins and the mount are different. Buy the board and the chip as a pair.",
      "Compare the generation, not the brand. Cores help when many jobs run at once, like a game plus a voice call. Clock, in GHz, helps one job finish sooner. Cache is fast memory inside the chip. Heat decides the cooler you need.",
      "Some chips include a small GPU. Some need a separate card before you get a picture. Neither brand wins every year. Read the model: a Ryzen 5 and a Core i5 from the same year, not just the name on the box.",
    ],
    checks: [
      {
        prompt: "Can you drop an AMD CPU into any Intel board?",
        choices: ["No. The socket is different.", "Yes, always.", "Only if the fans match.", "Only on a laptop."],
        answer: 0,
      },
      {
        prompt: "More cores help most when",
        choices: ["many tasks run at once", "you press one key", "the keyboard is silent", "you only change the RGB"],
        answer: 0,
      },
    ],
  },
  {
    id: "gpu",
    unit: "Build the PC",
    title: "The GPU",
    hook: "The CPU decides. The GPU draws.",
    body: [
      "A CPU has a few strong cores. A GPU has thousands of small cores that do the same math at once. That is how a frame gets every pixel, and how video effects finish in a reasonable time.",
      "VRAM is memory on the card. High detail and a 4K picture need more of it. When VRAM runs out, the game borrows slow system RAM and the picture stutters.",
      "NVIDIA, AMD, and Intel all make GPUs. Compare VRAM, the watts the card wants, and whether the case and the power supply can feed it. A huge card in a small case does not fit, even if the chip is fast.",
      "The GPU does not replace the CPU, the RAM, or the SSD. It draws what the CPU already decided.",
    ],
    checks: [
      {
        prompt: "A GPU is fast at",
        choices: ["the same math on many pixels", "replacing the keyboard", "keeping files after power-off", "clicking switches"],
        answer: 0,
      },
      {
        prompt: "VRAM is",
        choices: ["memory on the graphics card", "fan speed", "a key switch", "the monitor's refresh rate"],
        answer: 0,
      },
    ],
  },
  {
    id: "cooling",
    unit: "Build the PC",
    title: "Fans and heat",
    hook: "Heat is the leftover. If it stays, the chip slows down to survive.",
    body: [
      "Electricity through a chip makes heat. Past a limit, the chip throttles: it runs slower on purpose so it does not cook.",
      "Thermal paste fills the tiny gaps between the chip and the metal cooler. Air is a bad conductor. Paste lets the heat cross. It is not glue, and it is not optional fluff.",
      "A heatsink is fins. More metal in the air means more heat leaving the chip. A fan moves that air. Intake fans pull cool air in. Exhaust fans push hot air out. They should agree on a direction. Two fans blowing at each other just stir the heat.",
      "Air cooling is a fan on a tower of fins. Liquid cooling carries heat to a radiator that still has fans. Liquid is not magically silent. Noise is fan speed. Dust on the fins is a blanket, which is why an old PC gets loud.",
    ],
    checks: [
      {
        prompt: "Thermal paste is there to",
        choices: ["help heat move into the cooler", "glue the GPU forever", "store files", "make the keys click"],
        answer: 0,
      },
      {
        prompt: "Intake and exhaust fans should",
        choices: ["move air one way through the case", "blow at each other so air stays", "replace the RAM", "click like a keyboard"],
        answer: 0,
      },
    ],
  },
  {
    id: "peripherals",
    unit: "Use it",
    title: "Peripherals",
    hook: "If you plug it in, it is a peripheral.",
    body: [
      "The case holds the computer. A peripheral is a device on the edge: keyboard, mouse, monitor, headset, webcam, printer, drawing tablet, or an external drive.",
      "USB carries data and a little power. HDMI and DisplayPort carry the picture. A 3.5 mm jack carries analog sound. Something in the PC or the headset has to turn the numbers into that sound.",
      "Wireless still has a switch in the key. A radio, Bluetooth or a small dongle, only delivers the code. The battery is the new way it can fail.",
      "Many peripherals on one port can ask for more power than the port has. A powered hub is how you add them without starving the rest.",
    ],
    checks: [
      {
        prompt: "A peripheral is",
        choices: ["a device you plug into the computer", "the CPU core", "a RAM speed", "only the case fan"],
        answer: 0,
      },
      {
        prompt: "HDMI mostly",
        choices: ["carries the picture", "clicks the keys", "cools the CPU", "keeps files when power is off"],
        answer: 0,
      },
    ],
  },
  {
    id: "monitors",
    unit: "Use it",
    title: "HD, 4K, and Hz",
    hook: "Sharper and smoother are two different numbers.",
    body: [
      "Resolution is how many pixels. HD is 1280×720. Full HD, called 1080p, is 1920×1080. UHD, the thing people call 4K, is 3840×2160. That is about four times the pixels of 1080p.",
      "More pixels look sharper on a big screen, if the GPU can draw them. A 4K picture on a weak GPU means fewer frames, not a better game.",
      "Refresh rate is Hertz: pictures per second. 60 Hz is 60 pictures. 144 Hz is 144. Higher Hz looks smoother in motion. It is not the same as 4K. You can have 1080p at 144 Hz, or 4K at 60 Hz.",
      "The GPU has to fill that many pixels, that many times a second. Response time is how fast one pixel changes color. A slow pixel smears motion even when the Hz number is high.",
    ],
    checks: [
      {
        prompt: "4K, or UHD, means about",
        choices: ["3840×2160 pixels", "4 fans", "4 GB of RAM", "4 key sounds"],
        answer: 0,
      },
      {
        prompt: "144 Hz means",
        choices: ["144 pictures each second", "144 pixels across", "144 keys", "144 watts"],
        answer: 0,
      },
    ],
  },
  {
    id: "network",
    unit: "Beyond the case",
    title: "Networks",
    hook: "Computers do not send a whole file in one lump. They send packets.",
    body: [
      "A packet is a small envelope: who it is for, who sent it, and a slice of the data. Your network card or Wi-Fi radio puts those envelopes on a wire or in the air.",
      "A switch connects machines in one room. A router connects that room to other networks, including the internet. An IP address is this machine's number on that network. A site name is a word. DNS turns the word into the number.",
      "Ethernet is a cable. Wi-Fi is radio shared with everyone nearby. The cable is usually steadier and has less lag. Wi-Fi is how you move.",
      "Bandwidth is how much you can move at once. Latency is how long one packet takes. A download cares about bandwidth. A game cares about latency. Fast and wide are not the same.",
    ],
    checks: [
      {
        prompt: "A packet is",
        choices: ["a small envelope of data", "a RAM stick", "a key switch", "the GPU fan"],
        answer: 0,
      },
      {
        prompt: "Ethernet is usually steadier than Wi-Fi because",
        choices: ["it is a cable, not shared radio", "it has more keys", "it is 4K", "it replaces the CPU"],
        answer: 0,
      },
    ],
  },
  {
    id: "quantum",
    unit: "Beyond the case",
    title: "Quantum computers",
    hook: "Your PC uses bits. A quantum machine uses qubits. It is not a faster GPU.",
    body: [
      "A bit is 0 or 1. A qubit can be a mix of 0 and 1 until you measure it. That mix is called superposition. The measurement gives one answer, not both.",
      "Entanglement links qubits so a measurement of one tells you something about the other. That is the strange part, and it is real lab equipment, not a setting in a game.",
      "These machines are good at a few hard problems: some chemistry, some search, some codes. They are not faster at typing, loading a level, or drawing a frame. They need extreme cold, and they make errors that other qubits have to correct.",
      "You will not install a quantum chip in this case. Berty's PC is a normal computer. Knowing the difference keeps the word from turning into magic.",
    ],
    checks: [
      {
        prompt: "A qubit is different because",
        choices: ["it can be a mix of 0 and 1 until you measure it", "it is faster RAM", "it silences a keyboard", "it is a 4K pixel"],
        answer: 0,
      },
      {
        prompt: "A quantum chip in a school PC is",
        choices: ["not a normal part. These are special machines.", "the GPU", "the case fan", "required if the keys click"],
        answer: 0,
      },
    ],
  },
  {
    id: "storage",
    unit: "Build the PC",
    title: "SSD and spinning disks",
    hook: "The SSD is the filing cabinet. RAM is the desk.",
    body: [
      "Files that must survive power-off live in storage. A hard drive spins magnetic platters. An SSD is flash chips with no spin. The SSD starts faster, loads faster, and survives a bump better. A spinning drive can still hold a lot of files for less money.",
      "NVMe SSDs use PCIe, a fast lane on the motherboard. SATA SSDs use an older cable and move less data each second. Both are SSDs. The connector is the speed difference.",
      "Do not confuse the SSD with RAM. Power off, and RAM is empty. The SSD still has the files. If a game stutters the moment you turn, that is often RAM or the GPU. If it takes a long time to start, look at the drive.",
    ],
    checks: [
      {
        prompt: "An SSD feels faster than a spinning drive because",
        choices: ["nothing has to spin up", "it is the same part as RAM", "it clicks like a switch", "it raises the refresh rate"],
        answer: 0,
      },
      {
        prompt: "RAM and an SSD differ because",
        choices: ["RAM forgets when power is off. The SSD keeps the files.", "they are the same part", "the SSD is a fan", "RAM is the monitor"],
        answer: 0,
      },
    ],
  },
  {
    id: "power",
    unit: "Build the PC",
    title: "Watts",
    hook: "The power supply is a budget, not a speed score.",
    body: [
      "The wall gives alternating current. Parts want steady direct current, mostly 12 volts, 5 volts, and 3.3 volts. The power supply does that conversion.",
      "Watts are the budget. Add the CPU, the GPU, the fans, and the drives, then leave room. A graphics card can spike above the number on its box. A supply that is 'enough on paper' can still trip when the spike hits.",
      "80 Plus is an efficiency sticker. It does not prove the watt number is honest. A cheap label can sag under a real load.",
      "Modular cables unplug, so a clean build only installs the ones it needs. Do not mix cables from another brand. The plug can fit and still be wired wrong.",
    ],
    checks: [
      {
        prompt: "The power supply's job is to",
        choices: ["turn wall power into steady power for the parts", "draw the frames", "store photos", "click the keys"],
        answer: 0,
      },
      {
        prompt: "Why leave extra watts?",
        choices: ["Parts spike above their average", "So the keyboard is louder", "So RAM becomes 4K", "So the fans can stop"],
        answer: 0,
      },
    ],
  },
  {
    id: "bits",
    unit: "How it works",
    title: "Bits and bytes",
    hook: "A bit is one yes or no. The size on the box is bytes.",
    body: [
      "A bit is 0 or 1. Eight bits make a byte, which is enough for one letter in the old code. A thousand bytes is about a kilobyte. A million is a megabyte. A billion is a gigabyte. A trillion is a terabyte.",
      "Watch the letter. Mb means megabits. MB means megabytes. Eight bits make one byte, so 100 Mb of network speed is about 12 MB of file each second. The small b is the trick.",
      "A photo is megabytes. RAM is gigabytes. A pile of games is often terabytes. The SSD holds those files. RAM only holds what you are using right now.",
    ],
    checks: [
      {
        prompt: "Eight bits make",
        choices: ["a byte", "a monitor", "a fan", "a CPU core"],
        answer: 0,
      },
      {
        prompt: "100 Mb is smaller than 100 MB because",
        choices: ["a bit is one eighth of a byte", "they are the same", "Mb means motherboard", "MB means mouse button"],
        answer: 0,
      },
    ],
  },
  {
    id: "boot",
    unit: "How it works",
    title: "How a PC starts",
    hook: "The first program is on the motherboard, not in Windows.",
    body: [
      "When you press power, firmware runs. It is called BIOS or UEFI. It lives on a chip on the board. It is not the operating system, and it stays if you change Windows for Linux.",
      "POST is the power-on self test. The board asks the CPU, the RAM, and a disk to answer. A beep or a light code means something did not.",
      "Boot order is which disk it tries first. A USB stick first in that list can make the PC try to start from the stick instead of the SSD. The firmware then hands the machine to the operating system.",
    ],
    checks: [
      {
        prompt: "UEFI firmware lives",
        choices: ["on a chip on the motherboard", "in the key switches", "only in the cloud", "inside the fan"],
        answer: 0,
      },
      {
        prompt: "Boot order decides",
        choices: ["which disk the PC tries first", "how loud the keys are", "the RGB color", "the refresh rate"],
        answer: 0,
      },
    ],
  },
  {
    id: "os",
    unit: "How it works",
    title: "The operating system",
    hook: "The OS is the program that runs the other programs.",
    body: [
      "The operating system shares the CPU, the RAM, the disk, and the screen so two apps do not smash each other. A process is one running program. A file is named data on the disk.",
      "Windows, macOS, Linux, and ChromeOS are operating systems. The same game is often a different file for each one. The CPU still does the work.",
      "Sleep keeps RAM powered so the desk is still there. Shut down clears it. Restart is how a stuck driver gets a clean start. Closing a laptop lid is not always off.",
    ],
    checks: [
      {
        prompt: "The operating system",
        choices: ["runs the other programs and shares the parts", "is the same thing as the GPU", "replaces thermal paste", "clicks the switches"],
        answer: 0,
      },
      {
        prompt: "Sleep is different from shut down because",
        choices: ["sleep keeps RAM powered", "sleep erases the SSD", "they are the same", "sleep changes the CPU socket"],
        answer: 0,
      },
    ],
  },
  {
    id: "drivers",
    unit: "How it works",
    title: "Drivers",
    hook: "A driver is the translator for one part.",
    body: [
      "A driver is a small program the OS uses to talk to one device: the GPU, the Wi-Fi radio, a printer, or the extra keys on a keyboard. Without it, the part can sit there and do almost nothing.",
      "A monitor can show a picture from a basic driver and still refuse a high refresh rate until the real GPU driver is installed. Get that driver from the company that made the card, or from the OS updater.",
      "A random 'driver booster' is a common way to install junk. After a GPU driver install, restart. The old driver is often still in memory until you do.",
    ],
    checks: [
      {
        prompt: "A driver is",
        choices: ["the program that lets the OS talk to one part", "the case fan", "a RAM speed", "the paint on a key"],
        answer: 0,
      },
      {
        prompt: "A high refresh rate may stay off until",
        choices: ["the real GPU driver is installed", "the keys are clicky", "you add more RGB", "the paste dries"],
        answer: 0,
      },
    ],
  },
  {
    id: "cables",
    unit: "Build the PC",
    title: "Cables",
    hook: "A plug that fits is not the same as a plug that is fast.",
    body: [
      "HDMI carries picture and sound. DisplayPort does too, and on a PC monitor it is often the one that can hold a high refresh rate. USB carries data and some power.",
      "USB-C is a shape, not a speed. A USB-C cable can be charge-only, or data, or even video. Read what that cable can do. The shape will not tell you.",
      "The cable to the monitor has to support the resolution and the Hz you want. An old HDMI cable can cap you at 60 Hz on a faster panel. A GPU power cable is not a data cable. Forcing a plug bends pins.",
    ],
    checks: [
      {
        prompt: "USB-C means",
        choices: ["a plug shape, not one speed", "always 4K", "always a power supply", "a key switch"],
        answer: 0,
      },
      {
        prompt: "A monitor stuck at 60 Hz might be because",
        choices: ["the cable or the port is the old kind", "the keys are linear", "the RAM is DDR", "the fan is intake"],
        answer: 0,
      },
    ],
  },
  {
    id: "fps",
    unit: "Use it",
    title: "FPS and the screen",
    hook: "The GPU makes frames. The monitor shows some of them.",
    body: [
      "A frame is one picture the GPU finished. FPS is how many of those you got each second. Hz is how many the monitor can show each second.",
      "If the GPU makes 140 FPS and the monitor is 60 Hz, you see about 60. The extra frames never reach the panel. If the GPU makes 40 FPS on a 144 Hz monitor, the motion is still 40. The panel cannot invent the missing pictures.",
      "When they do not line up, the screen can tear: two frames in one picture. VSync waits so they match. That wait can add a little delay, which is why some players turn it off. FPS comes from the GPU, the resolution, and the detail. It is not a keyboard setting.",
    ],
    checks: [
      {
        prompt: "200 FPS on a 60 Hz monitor shows about",
        choices: ["60 pictures a second", "200 pictures a second", "4K", "no picture"],
        answer: 0,
      },
      {
        prompt: "Screen tearing is",
        choices: ["two frames in one picture", "a broken key", "the CPU slowing on purpose", "RAM forgetting"],
        answer: 0,
      },
    ],
  },
  {
    id: "panels",
    unit: "Use it",
    title: "IPS, TN, and OLED",
    hook: "The panel is the screen. The name is not the resolution.",
    body: [
      "IPS looks decent from the side and has decent color. It is the usual desk pick. TN is faster and cheaper and looks washed out from an angle. OLED makes real black because those pixels turn off. It costs more, and a still image left up for a long time can mark it.",
      "An IPS panel can be 1080p or 4K. A TN panel can be 60 Hz or 144 Hz. The panel type, the pixel count, and the refresh rate are three different facts.",
      "HDR needs a panel that can be much brighter and much darker in the same picture. A sticker that says HDR on a dim screen is mostly a sticker.",
    ],
    checks: [
      {
        prompt: "IPS, TN, and OLED are",
        choices: ["kinds of screen panel", "CPU sockets", "RAM speeds", "key switches"],
        answer: 0,
      },
      {
        prompt: "OLED black is deep because",
        choices: ["those pixels turn off", "it has more fans", "it is always 4K", "it replaces the OS"],
        answer: 0,
      },
    ],
  },
  {
    id: "layouts",
    unit: "Use it",
    title: "Keyboard shapes",
    hook: "Full-size, TKL, and a laptop are different tools.",
    body: [
      "A full-size keyboard has letters, a function row, arrows, and a number pad. TKL means tenkeyless: no number pad, so the mouse has more room. A 60% board also drops the function row and the arrows. You hold another key to reach them.",
      "A laptop uses short travel, usually a membrane or a scissor switch. It is quiet. It is not a desk full of clicky switches.",
      "Space, Enter, and Shift are long, so they ride a stabilizer: a wire that keeps the key from wobbling. A rattle is often that wire. ANSI is the long Enter key common in the US. ISO is the tall Enter key used in many other countries.",
    ],
    checks: [
      {
        prompt: "TKL means",
        choices: ["no number pad", "no letters", "a liquid cooler", "ten CPU cores"],
        answer: 0,
      },
      {
        prompt: "A stabilizer is",
        choices: ["the wire that keeps a long key from wobbling", "the GPU driver", "the boot chip", "a Wi-Fi band"],
        answer: 0,
      },
    ],
  },
  {
    id: "mouse",
    unit: "Use it",
    title: "The mouse",
    hook: "DPI is a count, not a skill.",
    body: [
      "DPI is how many steps the sensor reports for an inch of movement. Higher is finer, not better. Too high and a twitch spins the view. Many players keep the sensor steady and lower the in-game sensitivity.",
      "Polling rate is how often the mouse reports in, per second. 1000 times a second is every millisecond. Past that, a school screen will not show much difference.",
      "The sensor is a tiny camera of the desk. Clear glass gives it nothing to see, so the cursor skips. The speed slider in the OS and the DPI on the mouse are two knobs. Change one at a time.",
    ],
    checks: [
      {
        prompt: "DPI is",
        choices: ["how finely the sensor counts movement", "the monitor's pixel count", "a RAM speed", "frames per second"],
        answer: 0,
      },
      {
        prompt: "A mouse skips on glass because",
        choices: ["the sensor needs texture to see", "glass is 4K", "glass is a quantum chip", "the keys are silent"],
        answer: 0,
      },
    ],
  },
  {
    id: "bottleneck",
    unit: "How it works",
    title: "The bottleneck",
    hook: "The slow part makes the fast parts wait.",
    body: [
      "A bottleneck is the part the others wait on. If the GPU is maxed and the CPU is bored, the GPU is the limit. Lower the resolution or the detail. If the CPU is maxed and the GPU is loafing, a faster card will not add many frames.",
      "Full RAM is a bottleneck too. The PC starts using the SSD as fake memory and everything stutters. That is not the graphics card failing.",
      "A huge GPU on a tiny old CPU will not hit the FPS from a stream. Match them. The watts, the case, and the monitor's Hz are in the same chain. Look at what is busy. Do not guess from a logo.",
    ],
    checks: [
      {
        prompt: "A bottleneck is",
        choices: ["the part that makes the others wait", "a kind of key", "extra RGB", "another name for 4K"],
        answer: 0,
      },
      {
        prompt: "A faster GPU will not help much when",
        choices: ["the CPU is already full and the GPU is waiting", "the panel is IPS", "the keys click", "the paste is new"],
        answer: 0,
      },
    ],
  },
  {
    id: "wifi",
    unit: "Beyond the case",
    title: "Wi-Fi and the modem",
    hook: "The modem brings the internet in. The router shares it.",
    body: [
      "A modem brings the internet into the building. A router shares it and hands out local addresses. A lot of home boxes are both jobs in one shell. They are still two jobs.",
      "2.4 GHz Wi-Fi goes farther through walls. It is slower and more crowded. 5 GHz is faster and shorter. 6 GHz is a newer, quieter band, if both the laptop and the router have it. None of those is 4K. 4K is pixels.",
      "A channel is a lane. If every nearby router picks the same lane, you all wait. Ethernet, the cable, still wins when the PC does not need to move. The Wi-Fi password joins the network. It is not the password for a website.",
    ],
    checks: [
      {
        prompt: "A modem",
        choices: ["brings the internet into the building", "clicks the keys", "cools the CPU", "stores RAM"],
        answer: 0,
      },
      {
        prompt: "5 GHz Wi-Fi, next to 2.4 GHz, is usually",
        choices: ["faster, with a shorter range", "a kind of RAM", "the same as 4K", "a silent key switch"],
        answer: 0,
      },
    ],
  },
  {
    id: "laptop",
    unit: "Build the PC",
    title: "Laptop or desktop",
    hook: "The same name on the box is not the same chip.",
    body: [
      "A desktop lets you swap the GPU, the RAM sticks, the SSD, the cooler, and the power supply. A laptop squeezes those jobs into a slab. Some laptop RAM is soldered down. Some boards leave one slot free.",
      "A graphics chip in a laptop is often a smaller, lower-watt version. A name you saw on a stream can mean a different part in a laptop. Read that laptop's watt number.",
      "The battery is a budget you carry. A bright screen and a busy fan spend it. On a blanket, the intake is covered, the chip gets hot, and it slows itself. A desk does not have that problem. Plugged in, a laptop can run faster because it is not saving the battery.",
    ],
    checks: [
      {
        prompt: "A laptop part is often",
        choices: ["soldered, or a smaller version of the desktop part", "the exact desktop chip", "only a keyboard", "a quantum CPU"],
        answer: 0,
      },
      {
        prompt: "A laptop on a blanket slows down because",
        choices: ["the fan intake is covered", "blankets add RAM", "blankets raise the refresh rate", "the keys turn clicky"],
        answer: 0,
      },
    ],
  },
  {
    id: "rgb-myth",
    unit: "Build the PC",
    title: "Lights are not speed",
    hook: "RGB looks like a stream build. It does not add frames.",
    body: [
      "The lights in the case are LEDs. Lime, cyan, gold, or a slow cycle is a look. They use a little power and sometimes a messy app. They do not add cores, gigabytes, or FPS.",
      "If the PC is slow, find the part that is waiting. Full RAM, a maxed GPU, a throttling CPU, or a 60 Hz panel will not be fixed by a brighter strip.",
      "A dark case with the right parts beats a glowing case with the wrong ones. You are allowed to want both. Just do not pay for lights when the bottleneck is the chip.",
    ],
    checks: [
      {
        prompt: "RGB changes",
        choices: ["how the case looks", "how many frames you get", "the CPU socket", "the boot order"],
        answer: 0,
      },
      {
        prompt: "If the PC is slow, look first at",
        choices: ["the part that is waiting, not the lights", "the color of the strip", "whether the keys are blue", "a quantum setting"],
        answer: 0,
      },
    ],
  },
  {
    id: "safe",
    unit: "Beyond the case",
    title: "Stay safe",
    hook: "Free RAM from a popup is not a part you can install.",
    body: [
      "Updates close holes other people already know. Get them from the operating system and from the company that made the part. A popup that says the PC is doomed and offers a download is not that.",
      "A password is a secret for one site. Look at the address before you type it. A code that just arrived on a phone is a key to the account. Do not send that code to someone who asks, even if the message looks like a friend.",
      "A download that promises free RAM or free FPS is not hardware. Hardware is a part. Software that pretends to be a part is often junk. Copy a project you care about onto a second drive. Disks fail. An SSD is good. It is not forever.",
    ],
    checks: [
      {
        prompt: "A popup that offers free RAM is",
        choices: ["not a real part. Do not trust it.", "a DIMM you can seat", "the BIOS", "a case fan"],
        answer: 0,
      },
      {
        prompt: "A code that arrives on your phone is",
        choices: ["a key to the account. Do not forward it.", "a Wi-Fi band", "a key switch", "the refresh rate"],
        answer: 0,
      },
    ],
  },
  {
    id: "malware",
    unit: "Beyond the case",
    title: "Viruses and locks",
    hook: "A virus copies itself. A worm moves. Ransomware locks the file.",
    body: [
      "Antivirus does not make the PC faster. It finds a program that is trying to copy itself, and it deletes that copy. Zap in this game is that idea.",
      "A worm does not wait for you to open it. It crawls to the next machine. A lock, ransomware, hides your files and asks for money. You do not pay. You restore a copy you saved before.",
      "A popup that offers free RAM is not a part. Close it. Updates from the real company close the holes these things use.",
    ],
    checks: [
      {
        prompt: "A virus",
        choices: ["copies itself onto the machine", "is a case fan", "is a kind of RAM", "adds frames"],
        answer: 0,
      },
      {
        prompt: "Ransomware",
        choices: ["locks your files and asks for money", "is a faster GPU", "is a quiet key switch", "is 4K"],
        answer: 0,
      },
    ],
  },
];

const GUIDE_KEY = "br-guide-v1";

function bucket(code: string): Record<string, string[]> {
  try {
    const raw = JSON.parse(localStorage.getItem(GUIDE_KEY) || "{}") as Record<string, string[]>;
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

export function guideDone(code: string): string[] {
  const all = bucket(code);
  const list = all[code || "guest"];
  return Array.isArray(list) ? list.filter((id) => GUIDE.some((t) => t.id === id)) : [];
}

export function markGuide(code: string, id: string) {
  const key = code || "guest";
  const all = bucket(code);
  const cur = new Set(guideDone(key));
  cur.add(id);
  all[key] = [...cur];
  try {
    localStorage.setItem(GUIDE_KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
}
