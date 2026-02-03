export const sendDriverAcceptedFlexMessage = async (
  lineUserId: string, 
  driverFirstName: string,
  driverLastName: string,
  driverPhone: string,
  carBrand: string,
  carModel: string,
  carPlate: string,
  bookingId: number
) => {
    const flexMessage = {
        type: "flex",
        altText: "คนขับรับงานแล้ว - ไดรฟ์แคร์",
        contents: {
            type: "bubble",
            size: "mega",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "คนขับรับงานของคุณแล้ว!",
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
                                        text: "คนขับ",
                                        color: "#888888",
                                        size: "sm",
                                        flex: 3,
                                    },
                                    {
                                        type: "text",
                                        text: `${driverFirstName} ${driverLastName}`,
                                        weight: "bold",
                                        size: "sm",
                                        color: "#111111",
                                        flex: 4,
                                        wrap: true,
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
                                        text: "เบอร์โทร",
                                        color: "#888888",
                                        size: "sm",
                                        flex: 3,
                                    },
                                    {
                                        type: "text",
                                        text: driverPhone,
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
                                        text: "รถยนต์",
                                        color: "#888888",
                                        size: "sm",
                                        flex: 3,
                                    },
                                    {
                                        type: "text",
                                        text: `${carBrand}-${carModel} (${carPlate})`,
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
                            label: "โทรหาคนขับ",
                            uri: `tel:${driverPhone}`,
                        },
                        color: "#70C5BE",
                    },
                    {
                        type: "button",
                        style: "secondary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "เปิดแอปไดรฟ์แคร์",
                            uri: "https://drive-care-gilt.vercel.app",
                        },
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
        console.error("❌ LINE DRIVER ACCEPTED FLEX PUSH FAILED Status:", res.status);
        console.error("❌ LINE Error Detail:", text);
        throw new Error(`LINE driver accepted flex push failed: ${text}`);
    }
    console.log("✅ LINE driver accepted flex message sent successfully to:", lineUserId);
};
