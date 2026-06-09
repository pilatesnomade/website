const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendEmail(data) {
  const response = await fetch("https://api.resend.com/v1/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { error: error.message || "Failed to send email" };
  }

  return { data: await response.json() };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, day, time, cours } = body;

    if (!name || !email || !phone || !day || !time || !cours) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data, error } = await sendEmail({
      from: "Pilates Nomade <onboarding@resend.dev>",
      to: ["huitquatre.dev@gmail.com"],
      subject: "Nouvelle réservation - Pilates Nomade",
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

    if (error) {
      return new Response(
        JSON.stringify({ error }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}