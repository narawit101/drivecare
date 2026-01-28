export const sendLineMessage = async (lineUserId: string, message: string) => {

    const res = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_LINE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
            to: lineUserId,
            messages: [{ type: "text", text: message }],
        }),
    });

    const text = await res.text();

    if (!res.ok) {
        console.error("❌ LINE PUSH FAILED Status:", res.status);
        console.error("❌ LINE Error Detail:", text); // ตัวนี้จะบอกว่าทำไม 400 เช่น Invalid Token หรือ User Not Found
        throw new Error(`LINE push failed: ${text}`);
    }
    console.log("✅ LINE message sent successfully to:", lineUserId);
};