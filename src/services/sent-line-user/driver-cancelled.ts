export const sendDriverCancelledFlexMessage = async (
  lineUserId: string,
  bookingId: number
) => {
    const flexMessage = {
        type: "flex",
        altText: "คนขับยกเลิกงาน - ไดรฟ์แคร์",
        contents: {
            type: "bubble",
            size: "mega",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "แจ้งเตือนการเดินทาง",
                        weight: "bold",
                        size: "xl",
                        color: "#FF6B6B",
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
                        ],
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        contents: [
                            {
                                type: "text",
                                text: "ขออภัยในความไม่สะดวก",
                                weight: "bold",
                                size: "md",
                                color: "#FF6B6B",
                                margin: "md",
                            },
                            {
                                type: "text",
                                text: "เนื่องจากคนขับมีความจำเป็นต้องยกเลิกงานในครั้งนี้\n\nขณะนี้ระบบกำลังนำงานของคุณกลับเข้าสู่ระบบเพื่อจัดหาคนขับท่านใหม่ให้โดยด่วนที่สุด\nคุณสามารถตรวจสอบสถานะได้ผ่านแอปพลิเคชันครับ 🙏",
                                size: "sm",
                                color: "#666666",
                                wrap: true,
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
                            label: "ตรวจสอบสถานะ",
                            uri: "https://drive-care-gilt.vercel.app",
                        },
                        color: "#FF6B6B",
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
        console.error("❌ LINE DRIVER CANCELLED FLEX PUSH FAILED Status:", res.status);
        console.error("❌ LINE Error Detail:", text);
        throw new Error(`LINE driver cancelled flex push failed: ${text}`);
    }
    console.log("✅ LINE driver cancelled flex message sent successfully to:", lineUserId);
};
