import { NextResponse } from 'next/server';

const WHATSAPP_TOKEN = "EAAXCXkYb5dcBRBHPA43GifNCLD1GZA154Ry6BJGGqpBDmBzpM8NjspxZAtkVu3KKD5lTCasGIa5hHns32uePUv89WgkX2uSUZCqy5OrYIPj4xuH0hrp8kzCUdDkSDdAXgO7ri4bxvFWoPZCV6EAHClEDFJihGeXR4sqILR8DFQZAVSZBXCuYbwT4Om6g0hEBeKtSdNAHE6oUgDHxuZA6BlT28J81coAdyDjSbTZBvkKbqc8xsIP0pUxYDuEVHZCRWYEB7hMIgMasNyfUn2wE8CZAUDWARz";
const PHONE_NUMBER_ID = "1139885139198615";
const YOUR_WHATSAPP_NUMBER = "919626022722"; // Provided by user

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Contact API Route Triggered! Payload:", body);
    const { name, email, phone, message } = body;

    // Send WhatsApp Alert
    const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

    // Map fields to the 3 variables: Name, Phone, and Email/Message
    // Truncate message if it's too long line to fit in a variable securely, though WhatsApp supports long text.
    const serviceInfo = email ? `Email: ${email}` : 'No Email';

    const payload = {
      messaging_product: "whatsapp",
      to: YOUR_WHATSAPP_NUMBER,
      type: "template",
      template: {
        name: "alusea_web_form", // As set up in the template
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: String(name || "Unknown") },
              { type: "text", text: String(phone || "No Phone provided") },
              { type: "text", text: String(serviceInfo) }
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
