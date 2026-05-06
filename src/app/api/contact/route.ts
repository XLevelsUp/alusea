import { NextResponse } from 'next/server';

const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const YOUR_WHATSAPP_NUMBER = process.env.WHATSAPP_RECIPIENT_NUMBER;

export async function POST(req: Request) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !YOUR_WHATSAPP_NUMBER) {
    console.error("Missing required WhatsApp environment variables.");
    return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
  }

  try {
    const body = await req.json();
    console.log("Contact API Route Triggered! Payload:", body);
    const { name, phone, email, message } = body;

    // Send WhatsApp Alert
    const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
    console.log(body);

    // Map fields to the 4 template variables: {{1}} name, {{2}} phone, {{3}} email, {{4}} message
    const payload = {
      messaging_product: "whatsapp",
      to: YOUR_WHATSAPP_NUMBER,
      type: "template",
      template: {
        name: "alusea_web_form",
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: String(name || "Unknown") },
              { type: "text", text: String(phone || "No Phone provided") },
              { type: "text", text: String(email || "No Email provided") },
              { type: "text", text: String(message || "No message provided") }
            ]
          }
        ]
      }
    };

    const wpRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const wpData = await wpRes.json();
    console.log("WhatsApp API Response:", wpData);

    // If there is an existing logic to push to Google Sheets, it can be added here.
    // For now, we respond with success so the frontend can show the thank you message.

    return NextResponse.json({ success: true, meta: wpData });
  } catch (error) {
    console.error("Error sending contact form:", error);
    return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 });
  }
}
