import {Resend} from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

async function sendEmail(emailData) {
  const {data, error} = await resend.emails.send({
    from: 'Pilates nomade <onboarding@resend.dev>',
    to: ['judithmnl@gmail.com'],
    subject: "Nouvelle réservation - Pilates Nomade",
    html: emailData.html,
  });

  if (error) {
    console.log("Email sending error:", error);
    return { error };
  }

  return { data };
}

export async function POST(request) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { name, email, phone, day, time, cours } = body;

  if (!name || !email || !phone || !day || !time || !cours) {
    return new Response(JSON.stringify({ error: "All fields are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const result = await sendEmail({
      html: `
        <h2>Nouvelle réservation</h2>
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Téléphone:</strong> ${phone}</p>
        <hr />
        <h3>Créneau demandé:</h3>
        <p><strong>Jour:</strong> ${day}</p>
        <p><strong>Heure:</strong> ${time}</p>
        <p><strong>Cours:</strong> ${cours}</p>
      `,
    });

    if (result.error) {
      console.log("Email sending failed:", result.error);
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, data: result.data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Internal server error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}