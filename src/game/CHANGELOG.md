# Berty's Run

## BR 1.12.16 — 2026-10-03

- What's new: Clearer goals with an arrow to the nearest bit, any clear opens the next board, Pause and Restart on screen, a score that counts up, smoother jumps, steadier music, and a faster game on Chromebooks.

# Berty's Run

## BR 1.12.15 — 2026-10-03

- What's new: Berty zaps out of each level in a lightning bolt, arcade music plays during every run with its own volume, and the Bus Tube is smoother, fairer and easier to read.

## BR 1.12.14 — 2026-10-03

- What's new: Picking your PC takes you straight into the level.

## BR 1.12.13 — 2026-10-03

- What's new: Taps press only what you tap, ☀ Menu opens the game menu, and phones get bigger thumb buttons. Picking your PC takes you straight into the level.
- A finger scroll no longer presses the button it started on. One tap cannot press a second button after the panel moves.
- ☀ opens Settings on the title, Levels, Stage Clear, and Try again. Mid-level it opens the pause menu and stops the clock.
- Sideways phones keep Jump and Zap at the bottom-right thumb. Upright phones show a taller board.

## BR 1.12.12 — 2026-10-02

- What's new: Settings has a name, and the game starts without errors.

## BR 1.12.8 — 2026-10-02

- What's new: Sideways results now fit on one screen, with practice tiles and Levels on the right and no scrolling (1.12.7 still hid them on small phones). Esports heat Close goes back to your results.
- Berty's Run speaks your language, start to results. Follows the Hub language. English, Simple, Українська, Русский, Español, العربية, دری, Ikinyarwanda, ትግርኛ. Arabic and Dari are right to left. The board, the score numbers, and the left menu stay put.

## BR 1.12.7 — 2026-10-02


- What's new: Sideways results show every tile again, and Next is always on screen.

## BR 1.12.6 — 2026-10-01

- What's new: Fits phones. Full-width panels, the paused game shows behind the menu, and Español is complete.

## BR 1.12.5 — 2026-10-01

- What's new: Settings fills the panel from the start screen.

## BR 1.12.4 — 2026-10-01

- What's new: Retry restarts the board. Practice and Bus Tube work from results. Esports heat opens only from its button. Bigger Stage Clear. Right next reward. Menu on the left.

## BR 1.12.3 — 2026-10-01

- A real clear sends one TechWorks score through Hub sign-in. The app id is berty-run. No typed name.

## BR 1.12.2 — 2026-09-30

- The start screen is the title, Play, and Levels. Sign in, the rig, heat, crew, scores, and settings sit behind the gear. Levels is one grid: 2D, then 3D, then Bus Tube. A locked card is just a lock.

## BR 1.12.1 — 2026-09-30

- A fall on the easy 3D boards puts Berty back on the lane, not off the edge. Two falls in five seconds costs a heart and returns him to the last ring.
- Rings and bits that sat on a fan, a boost, or a virus were moved. Narrow corners got funnel walls. Retry puts magnet bits back. Pit Drop no longer talks about a hole. Bus Tube needs both bits. The score sits under the timer, and the hint sits under that.

## BR 1.12.0 — 2026-09-30

- Your rig. Pick a cabinet color, a Berty color, and a sticker. The name is built from those picks. No typing. It saves on this Chromebook, signed in or not.
- Settings no longer talks like a developer note. Buttons press in. Tap targets stay at least 44px.

## BR 1.11.1 — 2026-09-30

- Bus Tube. A fake-3D tunnel on the flat canvas. Step onto a wall and the run turns 90 degrees. Miss a tile and you fall back in. The wire spins until you jump off.

## BR 1.11.0 — 2026-09-30

- Arcade cabinet is the new look: neon title, stage clear, high-score initials, and original chiptune. Classic is still there.
- Settings has Arcade / Classic, cabinet colors, scanlines, music, sound, volume, and Berty skins. `?theme=classic` forces today's look.
- Roll back the door with git tag `br-1.10.37-classic`. Delete `src/arcade` and the arcade import in styles.css to drop the theme from the source.

## BR 1.10.37 — 2026-09-30

- The menu is a real layer above the board (z-index 20). The board is z-index 0 and ignores taps while a menu is open.

## BR 1.10.36 — 2026-09-30

- The board is not on the page while a menu is open, so a phone tap cannot land on the canvas.

## BR 1.10.35 — 2026-09-30

- Android taps on Play, Sign in, and the level list. The menu covers the board, and a touch runs the button.

## BR 1.10.34 — 2026-09-30

- Phone taps hit the menu. The board no longer sits on top of Play, Sign in, or the level list. A short phone screen scrolls inside the menu.

## BR 1.10.33 — 2026-09-29

- No typed names. Sign in is the Hub button. A score is sent only with the TechWorks code.

## BR 1.10.32 — 2026-09-27

- Race start. The clock waits through 3, 2, 1, GO. A bar under the time shows how close you are to par.

## BR 1.10.31 — 2026-09-27

- Esports heat. The call uses real times on this computer and fills empty seats with labeled demo rivals. Run it again for a new field.

## BR 1.10.30 — 2026-09-27

- Fullscreen and Tilt stay landscape. The phone no longer unlocks, flips to portrait, and snaps back. If the lock is refused, the board itself turns sideways so play stays wide.

## BR 1.10.29 — 2026-09-27

- One splash: the story, a short name, the PC they want, then Play. How-to is no longer four slides in the way. Home says which part the next win adds.

## BR 1.10.28 — 2026-09-27

- Dropped the forced square. The board fills the real window, wide or tall. The play menu is a side card so the course stays visible.

## BR 1.10.27 — 2026-09-27

- The how-to frames the whole board in the square. The card no longer grows a scrollbar.

## BR 1.10.26 — 2026-09-27

- The game sits in a square that fills the real screen. It watches the visual viewport, rotation, and browser chrome, and moves with them. The how-to shows the whole board in that square.

## BR 1.10.25 — 2026-09-27

- The how-to no longer covers the board. The preview opens on the course, with Berty rolling and the fans turning. The words sit in a short card at the bottom.

## BR 1.10.24 — 2026-09-27

- The still parts of a 2D board are drawn once and reused. A Chromebook with 4 cores skips 3D shadows and uses a smaller picture. Switching away from the tab freezes the clock instead of burning the run.

## BR 1.10.23 — 2026-09-27

- Keyboard: WASD moves, Space jumps, E zaps. Those keys do not scroll the page during a run. On a phone the stick stays on the left. Jump and Zap sit on the right.

## BR 1.10.22 — 2026-09-27

- Real boards lock again until the one before is at or under par. Practice 2D and Practice 3D stay open and do not count as a PC part. The course picture is flatter, the lane is lighter, and the bits are brighter.

## BR 1.10.21 — 2026-09-27

- Install only shows when the board is cleared, the check is passed, and the watts are there. Otherwise it says what is still missing.

## BR 1.10.20 — 2026-09-27

- Play sits under the board name. Berty's powers and the long notes stay folded. The lane is a copper trace. The gear no longer covers Your PC.

## BR 1.10.19 — 2026-09-26

- Portrait is not locked. Play asks for landscape, then lets the phone turn if it cannot. Walls are chips with a thin copper line, and Jump sits above the stick.

## BR 1.10.18 — 2026-09-26

- The 3D sky is a real board, not a stretched picture. Roads use solder mask, copper, and the part that level teaches. Flat walls match that part.

## BR 1.10.17 — 2026-09-26

- Play uses a thumb controller. Jump sits on the right, see-through. The other buttons live in a menu. Tilt tries to lock the phone so it does not flip.

## BR 1.10.16 — 2026-09-26

- Berty talks during the run. The bar shows who to beat. Save class board carries every short name.

## BR 1.10.15 — 2026-09-26

- Back during a run returns to the boards and keeps stars. A clear puts your short name on this computer's board, and Berty says where you placed.

## BR 1.10.14 — 2026-09-26

- Zap is a button, and only on boards with a virus. Bot powers still turn on by themselves after wins.

## BR 1.10.13 — 2026-09-26

- Flat boards are drawn at an angle. Walls stand up. Berty stays the round robot.

## BR 1.10.12 — 2026-09-26

- Flat boards can hop. Jump clears a pit or a fan. Walls still stop you.

## BR 1.10.11 — 2026-09-26

- Berty is the round robot again, on the flat boards and in 3D.

## BR 1.10.10 — 2026-09-26

- On a 2D board, holding the mouse rolls Berty toward the cursor.

## BR 1.10.9 — 2026-09-26

- Three new boards: Heat Sink, Packet Lane, and Dark Bay. Grab bits quickly for a streak. The last bit opens the port.

## BR 1.10.8 — 2026-09-26

- Full hides the Tech Room bar so the board can use the screen. Exit, or Escape, puts the bar back.

## BR 1.10.7 — 2026-09-26

- The board fills the phone, including landscape. Tilt works on 2D boards too. Tip the phone and the marble leans. The Hub frame is allowed to read the motion sensors.

## BR 1.10.6 — 2026-09-26

- The grip button sits under the score so the time stays readable. Jump and Zap sit above the thumbs. Keys mode on a 2D board only tilts while the mouse button is held. Small leans are softer.

## BR 1.10.5 — 2026-09-26

- Pick a play style and keep it. Two hands for a phone or a touch screen. Keys and mouse together on a computer. Lean, Follow, and Tilt are still there.

## BR 1.10.4 — 2026-09-26

- 3D has a mouse tilt for Chromebooks and Windows. Move the cursor. The center mark is straight. Up rolls forward.

## BR 1.10.3 — 2026-09-26

- 3D can use the iPad's tilt. Tap Tilt, hold the angle you want for straight, then lean. If the device has no sensor, Steer and Follow stay.

## BR 1.10.2 — 2026-09-26

- Follow is a touch control. Tap Follow, hold a finger on the board, and Berty rolls to it. Lean is still there if you turn Follow off.

## BR 1.10.1 — 2026-09-26

- The shop and the poster are the same place now. Navy floor, orange crate walls, Berty rides the supply crate, and the bay shows that art.

## BR 1.10.0 — 2026-09-26

- The bay is glass now. Round controls, a violet night behind the boards, and lime, cyan, and gold that read from across the room.

## BR 1.9.11 — 2026-09-25

- How-to leads straight into Roll Out. Name, PC pick, and the part question come after the first clear.
- Pause stops the clock and shows Resume, Retry, and Boards. Zap stays off Roll Out.

## BR 1.9.10 — 2026-09-25

- The menu sits on the left on a wide screen, so the game stays large beside it. Nothing uses the full monitor height, so the shell does not cut off the bottom.

## BR 1.9.9 — 2026-09-25

- 3D worlds sit in a dark computer wallpaper. The first boards steer slower and put you back on the path instead of ending the run.
- Pink viruses, worms, and locks can be zapped or jumped. A defrag pad gives a push. Case Fan has a virus in 2D too.

## BR 1.9.8 — 2026-09-25

- Español shows the lesson idea and the questions in Spanish. The long page stays behind a button.
- Simple hides the long page until you ask for it.

## BR 1.9.7 — 2026-09-25

- A short name is saved on this Chromebook. Other shop apps can read it and save scores next to it. Not a real name.
- 3D levels start closed so the home box fits. The field guide can be read aloud, and it says when the long lesson is still in English.

## BR 1.9.6 — 2026-09-25

- 3D boards are different shapes now: a pit, a zigzag, a long ice shelf, a left hop, a square room, and a snake.
- Bits pop when Berty grabs them.

## BR 1.9.5 — 2026-09-25

- Menus use a plain font, bigger labels, and sentence case so the words are easier to read.

## BR 1.9.4 — 2026-09-25

- A gear opens Settings. Pick English, Simple words, or Español.
- Read aloud, big text, and fewer answers are switches. Learn and the other tools are in there too.

## BR 1.9.3 — 2026-09-25

- The home box fits without a scrollbar. Open More about this, What they do, or a level list if you want the rest.

## BR 1.9.2 — 2026-09-25

- Berty's powers are pictures. Yours is lit. The next one is marked. The rest wait on a win count.
- The word list is under What they do.

## BR 1.9.1 — 2026-09-25

- The home screen uses short lines. Time, watts, and Berty's gear list are tucked under More about this and Berty's gear.

## BR 1.9.0 — 2026-09-25

- A part stays locked until you clear its own board. Watts from another board cannot buy it.
- The home screen shows watts, the aim time, and the part that board earns.

## BR 1.8.9 — 2026-09-25

- Boards stay on the first tab. The case, the lights, and the shell are on Your PC.
- You do not have to scroll past the computer to pick a level.

## BR 1.8.8 — 2026-09-25

- The case has a glass side, two spinning fans, and a light strip.
- Tap a chip to change it: lime, cyan, gold, magenta, violet, orange, white, or RGB. The shell can be black, white, or graphite.

## BR 1.8.7 — 2026-09-25

- After a clear, the big button is the next board. Install no longer dumps you back on the board you just finished.
- Leaving the lab after a win opens the next board on the menu.

## BR 1.8.6 — 2026-09-25

- 2D and 3D boards sit in a two-column grid. The name is on top. The part is under it.
- Less scrolling on a Chromebook.

## BR 1.8.5 — 2026-09-25

- Berty is on the goal screen and the home screen. Kids can see who they are helping.
- His gear is listed: Glow, spare heart, bit pull, hot boost, light trail, gold ring. Each one turns on after a set number of clears.

## BR 1.8.4 — 2026-09-25

- The banner no longer says Bay open. That was painted into the picture.
- Boards with no new part say Practice, not Extra.
- Play steps are tested: name, goal, question, then the run.

## BR 1.8.3 — 2026-09-25

- Play always does the next step. No short name asks for one. No goal opens the picker. Then the board starts.
- A button can no longer submit a form by accident and wipe the click.

## BR 1.8.2 — 2026-09-25

- One story: Berty is learning the computer by exploring. You help. The PC is the reward.
- The goal picker, the how-to, and the clear screen say that same thing.

## BR 1.8.1 — 2026-09-25

- Case lights are on the first screen: Lime, Cyan, Gold, or RGB.
- The pick changes the buttons right away. RGB still cycles on the case.

## BR 1.8.0 — 2026-09-25

- The menus look like an old computer: square screen, block type, and a hard bezel.
- Same black, lime, cyan, and gold. No new colors.

## BR 1.7.9 — 2026-09-25

- The title stays Berty's Run. Your goal sits under it.
- A Learn topic starts with one paragraph. The rest is a tap away, so the questions are not buried.
- More shows boards and stars as words, not a row of tiny boxes.

## BR 1.7.8 — 2026-09-25

- The menu is Play, Learn, and More. Stats, sound, the goal, and the paper plan are under More.
- Learn is four units: Build the PC, Use it, How it works, Beyond the case.

## BR 1.7.7 — 2026-09-25

- The part test is one sentence and one question. The extra lines are gone.
- On a phone, Your PC, 2D levels, 3D levels, and Learn sections start closed. Tap Show.

## BR 1.7.6 — 2026-09-25

- Every board has one more idea: a ring in a better spot, a second lane, a slide, or a boost. Fans are a little slower so you can time them.
- Aim times moved up a few seconds so the extra bit does not cost a star.

## BR 1.7.5 — 2026-09-24

- Learn fills the gaps: bits and bytes, boot, the OS, drivers, cables, FPS, screen panels, keyboard shapes, the mouse, bottlenecks, Wi-Fi, laptops, why RGB is not speed, and staying safe.
- Topics are grouped. A saved file lists what you learned.

## BR 1.7.4 — 2026-09-24

- Learn opens a field guide: keys, switch sounds, RAM speed, AMD and Intel, GPUs, cooling, peripherals, HD and 4K and Hz, networks, quantum computers, storage, and watts.
- Each topic is a real explanation plus two checks. A pass sticks to the short name.

## BR 1.7.3 — 2026-09-24

- The PC is a case now. Parts light up as you clear them. The fan spins when the cooler is in.
- Case lights: Lime, Cyan, Gold, or a slow RGB cycle. Each short name keeps its own color.

## BR 1.7.2 — 2026-09-24

- Pretty PC is gone. The third goal is a Creator PC: pictures, music, and video.
- A saved Pretty PC becomes a Creator PC.

## BR 1.7.1 — 2026-09-24

- Four new levels: Cable Loom, Case Fan, Signal Hop, and Case Drop. Each asks its own short question the first time.
- Berty's glow, pull ring, trail, and gold ring now move. The trail shows after 7 clears. The gold ring shows after 10.

## BR 1.7.0 — 2026-09-24

- Berty is building a PC for you. You pick Gaming, Pretty, or Laptop. Every path still builds a regular computer.
- A new level asks one short question first. A level you already cleared does not ask again.
- Paper plan opens PaperLab for that kind of PC.

## BR 1.6.9 — 2026-09-24

- The new title picture has its own address, so a phone does not keep showing the old orange one. The browser icon matches the bay.

## BR 1.6.8 — 2026-09-24

- The title picture matches the bay: black, lime, cyan, and gold. The old orange photo is gone.
- Leftover "orange" lines in the lessons now say gold or lime.

## BR 1.6.7 — 2026-09-24

- The bay is black, lime, cyan, and gold. Buttons are lime. Bits and the reward read as gold. 3D lights are cyan and gold on a black track.
- No strobe. The glow stays still so it is bright without flashing.

## BR 1.6.6 — 2026-09-24

- On a phone, the level list is at the top, with 2D and 3D labeled. The play buttons sit under it.
- The corner pad is a bit larger, and the hint says to drag it.

## BR 1.6.5 — 2026-09-24

- The five 3D levels were still in the list, with no 3D label. They now sit under their own heading: Around the Bend, Pit Drop, Blade Walk, Slick Shelf, and I/O Exit.

## BR 1.6.4 — 2026-09-24

- Stats, not a race. Each student shows levels cleared, total stars, and a best time on every level.
- Each level says under par or over par. Places are gone.

## BR 1.6.3 — 2026-09-24

- The room board lists each student, then their best time and stars on every level.
- A faster run on that level replaces the old one. Slower runs stay off the board.

## BR 1.6.2 — 2026-09-24

- The clock shows your time against par, and a clear leads with stars and under or over par.
- Each alias posts a best time on the room board for that Chromebook. The save file includes the board for TechWorks later.
- Fan Line no longer puts a fan on the port. Par is 1:04 there, and 0:58 on Thermal Paste, so a careful run can still score.

## BR 1.6.1

- A clear shows a PC case. The part you just earned snaps into its slot and says "just in."
- Let's roll stays hidden until the short name is saved, so the button does not sit there doing nothing.

## BR 1.6.0

- Two columns: teach on the left, boards and PC parts on the right. Phone stacks them.
- First visit plays four short beats. Skip waits until the second beat. Gate is `br-howto-v1`.
- A short name is required before the first clear. The reward says who slotted which part.
- Board to part: Roll Out Motherboard, Mind the Pit Power, Fan Line CPU, Thermal Paste RAM, Crew Gate Cooler, Around the Bend SSD, Pit Drop GPU, Blade Walk Network, Slick Shelf BertyOS. Shop Exit is the boot.
- Bot ladder stays: Glow, Spare heart, Bit pull, Hot boost.
- Save successes downloads the json. Plain list downloads a txt. Open a saved file is under More.

## BR 1.5.18

- Save successes writes the alias code, boards, watts, parts, and bot features to a file.
- The desk does not take it yet. Keep the file.

## BR 1.5.17

- Watts, parts, boards, and bot features stay on an alias code, like `JAY-7Q`.
- The same short name brings that PC back. A different name is a different PC. The reward card shows the code.

## BR 1.5.16

- Clears add features to Berty: Glow, Spare heart, Bit pull, Hot boost.
- A clear fills the screen with the PC part those watts are for, and the new bot feature when one unlocks.

## BR 1.5.15

- Day one is a hello and Let's roll. Other boards, the PC, and the short name wait until they are useful.
- Tell me more still has the longer welcome. Nothing was removed.

## BR 1.5.14

- Nothing was removed. Extra controls show up when they matter.
- Tap the PC row to open Build Lab. Install appears when you can afford the next part.
- Two players only on Crew Gate. Best run only after you have one. Save file after a name or a clear. This hour only from the class link. Sound stays in the corner.

## BR 1.5.13

- A clear shows the PC: Board, Power, CPU, RAM, OS. The next part is outlined. Install a part is the first button.
- The same row sits on the menu, so the computer is visible before the first run.

## BR 1.5.12

- Guide bar: short name plus the next thing to do.
- A clear says which PC part the watts move you toward, and offers Save this run.
- The file is `alias.bertyrun.json`. Short name only. No roster id.

## BR 1.5.11

- Student menu says the job: pick a board, get the bits, park in the port. Version chip, par, stamped, and test unlock are out of the kid copy.
- Play, How to play, and Home stay up front. This hour, Build Lab, Crew, save file, and sound sit under More.
- `TEMP_UNLOCK_ALL_LEVELS` is still true.

## BR 1.5.10

- Fan Line: two-tile gate in the mid wall beside the boost and the crate. Fans stay. The parked fan moved off the bit it was covering.
- `TEMP_UNLOCK_ALL_LEVELS` is true. Every 2D and 3D board is selectable. Set it false in `courses.ts` to put the par gates back. `isUnlocked` was not removed.
