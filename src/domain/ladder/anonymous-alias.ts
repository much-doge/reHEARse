/** Game pseudonyms derived from random run IDs, never from real names. */
const ADJECTIVES = ["Curious", "Mellow", "Misty", "Sunny", "Cosmic", "Gentle", "Happy", "Brave", "Dapper", "Dreamy", "Jolly", "Lively", "Lucky", "Nimble", "Playful", "Quiet", "Sleepy", "Snappy", "Sparkly", "Swift", "Witty", "Woolly", "Breezy", "Clever", "Cozy", "Dancing", "Glowing", "Golden", "Kind", "Little", "Peppy", "Velvet"];
const ANIMALS = ["Otter", "Puffin", "Panda", "Fox", "Koala", "Gecko", "Owl", "Wombat", "Dolphin", "Badger", "Capybara", "Axolotl", "Penguin", "Lemur", "Rabbit", "Turtle", "Toucan", "Walrus", "Robin", "Mantis", "Heron", "Beaver", "Bison", "Cricket", "Ferret", "Flamingo", "Giraffe", "Hamster", "Hedgehog", "Ibis", "Jaguar", "Kestrel", "Lobster", "Lynx", "Meerkat", "Narwhal", "Octopus", "Orca", "Osprey", "Pangolin", "Parrot", "Pelican", "Quail", "Quokka", "Raccoon", "Raven", "Seal", "Sloth", "Sparrow", "Squirrel", "Starfish", "Swan", "Tapir", "Tiger", "Wallaby", "Whale", "Yak", "Zebra", "Moth", "Duck", "Frog", "Gazelle", "Marmot", "Seahorse"];
function hash(seed: string) {
  let value = 2166136261;
  for (const char of seed) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}
export function anonymousAlias(runId: string) {
  return `${ADJECTIVES[hash(`adjective:${runId}`) % ADJECTIVES.length]} ${ANIMALS[hash(`animal:${runId}`) % ANIMALS.length]}`;
}
/** Read-only legacy presentation; stored aliases and learning records remain intact.
 * Reserve all base names before suffixing, so even an existing "Name 2" stays distinct.
 */
export function displayAliases(rows: Array<{ id: string; alias: string }>) {
  const bases = rows.map((row) => /^Listener [0-9A-F]{4}$/i.test(row.alias) ? anonymousAlias(row.id) : row.alias);
  const reserved = new Set(bases), used = new Set<string>(), result = new Map<string, string>();
  rows.forEach((row, index) => {
    const base = bases[index];
    let name = base, suffix = 2;
    while (used.has(name)) {
      do { name = `${base} ${suffix++}`; } while (reserved.has(name));
    }
    used.add(name); result.set(row.id, name);
  });
  return result;
}
