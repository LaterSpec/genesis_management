const supabaseUrl = "http://127.0.0.1:55421";
const supabaseKey = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

async function testFetch() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/products?select=id`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data length:", data.length);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testFetch();
