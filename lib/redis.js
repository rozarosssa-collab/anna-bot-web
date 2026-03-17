const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisGet(key) {
  const res = await fetch(`${REDIS_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const data = await res.json();
  if (!data.result) return null;
  return JSON.parse(data.result);
}

async function redisSet(key, value) {
  await fetch(`${REDIS_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SET", key, JSON.stringify(value)]),
  });
}

function getMonthKey() {
  const now = new Date();
  return `stats_${now.getFullYear()}_${now.getMonth() + 1}`;
}

function getTodayKey() {
  const now = new Date();
  return `day_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}`;
}

function getDayKeyFromParts(year, month, day) {
  return `day_${year}_${month}_${day}`;
}

export async function getMonthStats() {
  const result = await redisGet(getMonthKey());
  if (!result) return { web_cost: 0, tg_cost: 0, web_messages: 0, tg_messages: 0, whisper_cost: 0, input_tokens: 0, output_tokens: 0 };
  return result;
}

export async function updateStats(updates) {
  const current = await getMonthStats();
  const updated = {
    web_cost: (current.web_cost || 0) + (updates.web_cost || 0),
    tg_cost: (current.tg_cost || 0) + (updates.tg_cost || 0),
    web_messages: (current.web_messages || 0) + (updates.web_messages || 0),
    tg_messages: (current.tg_messages || 0) + (updates.tg_messages || 0),
    whisper_cost: (current.whisper_cost || 0) + (updates.whisper_cost || 0),
    input_tokens: (current.input_tokens || 0) + (updates.input_tokens || 0),
    output_tokens: (current.output_tokens || 0) + (updates.output_tokens || 0),
  };
  await redisSet(getMonthKey(), updated);
  return updated;
}

export async function getDayStats(year, month, day) {
  const result = await redisGet(getDayKeyFromParts(year, month, day));
  if (!result) return { web_cost: 0, tg_cost: 0, messages: 0 };
  return result;
}

export async function updateDayStats(updates) {
  const key = getTodayKey();
  const current = await redisGet(key) || { web_cost: 0, tg_cost: 0, messages: 0 };
  const updated = {
    web_cost: (current.web_cost || 0) + (updates.web_cost || 0),
    tg_cost: (current.tg_cost || 0) + (updates.tg_cost || 0),
    messages: (current.messages || 0) + (updates.messages || 0),
  };
  await redisSet(key, updated);
  return updated;
}
