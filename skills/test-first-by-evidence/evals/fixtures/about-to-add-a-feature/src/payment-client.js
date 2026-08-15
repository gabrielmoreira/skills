export async function charge(amount, token) {
  const res = await fetch("https://pay.example/v1/charges", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error(`charge failed: ${res.status}`);
  return res.json();
}
