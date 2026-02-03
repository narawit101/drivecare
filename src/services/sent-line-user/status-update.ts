export const sendStatusUpdateFlexMessage = async (
  lineUserId: string,
  bookingId: number,
  thaiStatus: string,
  currentStatus: string
) => {
    const flexMessage = {
        type: "flex",
        altText: "อัปเดตสถานะการเดินทาง - ไดรฟ์แคร์",
        contents: {
            type: "bubble",
            size: "mega",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "อัปเดตสถานะการเดินทาง !",
                        weight: "bold",
                        size: "xl",
                        color: "#70C5BE",
                        margin: "md",
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        spacing: "sm",
                        contents: [
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "หมายเลขการจอง",
                                        color: "#888888",
                                        size: "sm",
                                        flex: 3,
                                    },
                                    {
                                        type: "text",
                                        text: `${bookingId}`,
                                        weight: "bold",
                                        size: "sm",
                                        color: "#111111",
                                        flex: 4,
                                    },
                                ],
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "สถานะปัจจุบัน",
                                        color: "#888888",
                                        size: "sm",
                                        flex: 3,
                                    },
                                    {
                                        type: "text",
                                        text: thaiStatus,
                                        weight: "bold",
                                        size: "sm",
                                        color: "#111111",
                                        flex: 4,
                                        wrap: true,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                contents: [
                    {
                        type: "button",
                        style: "primary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "ติดตามสถานะ",
                            uri: "https://drive-care-gilt.vercel.app",
                        },
                        color: "#70C5BE",
                    },
                ],
            },
        },
    };

    const res = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_LINE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
            to: lineUserId,
            messages: [flexMessage],
        }),
    });

    const text = await res.text();

    if (!res.ok) {
        console.error("❌ LINE STATUS UPDATE FLEX PUSH FAILED Status:", res.status);
        console.error("❌ LINE Error Detail:", text);
        throw new Error(`LINE status update flex push failed: ${text}`);
    }
    console.log("✅ LINE status update flex message sent successfully to:", lineUserId);
};
