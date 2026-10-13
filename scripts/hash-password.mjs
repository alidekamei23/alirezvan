// Makes the bcrypt hash for the admin password. Run: npm run hash-password
// The password is typed at a prompt and never shown, logged or taken from the command
// line. The script prints one line to paste into .env.local.
import bcrypt from "bcryptjs";

const COST = 12;
const MIN_LENGTH = 12;
// bcrypt reads only the first 72 bytes of a password.
const MAX_BYTES = 72;

if (process.argv.length > 2) {
  console.error("Do not pass the password as an argument. Run the command and type it at the prompt.");
  process.exit(1);
}

/** Reads one line from the terminal without echoing it. */
function askHidden(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stderr } = process;
    stderr.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const done = (action) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stderr.write("\n");
      action();
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") return done(() => resolve(value));
        if (char === "\u0003") return done(() => reject(new Error("Cancelled")));
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (char >= " ") value += char;
      }
    };
    stdin.on("data", onData);
  });
}

/** For piped input (no terminal): the first two lines are the password and its repeat. */
async function readPiped() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  const [first = "", second = first] = data.split(/\r?\n/);
  return [first, second];
}

try {
  const [password, repeat] = process.stdin.isTTY
    ? [await askHidden("Admin password: "), await askHidden("Repeat password: ")]
    : await readPiped();

  if (password !== repeat) throw new Error("The two passwords are not the same.");
  if (password.length < MIN_LENGTH) {
    throw new Error(`Use at least ${MIN_LENGTH} characters.`);
  }
  if (Buffer.byteLength(password, "utf8") > MAX_BYTES) {
    throw new Error(`Use at most ${MAX_BYTES} bytes (Persian letters count as two each).`);
  }

  const hash = await bcrypt.hash(password, COST);
  // Next.js treats "$" in env files as the start of a variable, so each one is escaped.
  console.error("\nPaste this line into .env.local (keep the backslashes):\n");
  console.log(`ADMIN_PASSWORD_HASH=${hash.replaceAll("$", "\\$")}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Failed.");
  process.exit(1);
}
