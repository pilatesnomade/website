const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_API_SECRET = process.env.MAILJET_API_SECRET;
const MAILJET_LIST_ID = process.env.MAILJET_LIST_ID;

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
    if (!MAILJET_API_KEY || !MAILJET_API_SECRET || !MAILJET_LIST_ID) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  let email;
  try {
    const body = await request.json();
    email = body.email?.trim();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!email || !validateEmail(email)) {
    return new Response(JSON.stringify({ error: "Valid email is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const credentials = btoa(`${MAILJET_API_KEY}:${MAILJET_API_SECRET}`);
  const headers = {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json"
  };

  try {
    // First, check if contact already exists
    const getContactResponse = await fetch(
      `https://api.mailjet.com/v3/REST/contact/${encodeURIComponent(email)}`,
      { method: "GET", headers }
    );

    if (getContactResponse.ok) {
      const contactData = await getContactResponse.json();
      if (contactData.Data && contactData.Data.length > 0) {
        const contactId = contactData.Data[0].ID;
        return new Response(JSON.stringify({ error: "Contact already exists", contactId }), {
          status: 409,
          headers: { "Content-Type": "application/json" }
        });
      }
    } else if (getContactResponse.status !== 404) {
      const errorData = await getContactResponse.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: errorData?.ErrorMessage || "Failed to check contact" }),
        { status: getContactResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Contact not found, proceed with POST to create
    const contactResponse = await fetch("https://api.mailjet.com/v3/REST/contact", {
      method: "POST",
      headers,
      body: JSON.stringify({ Email: email})
    });

    let contactId;

    if (contactResponse.ok) {
      const contactData = await contactResponse.json();
      contactId = contactData.Data?.[0]?.ID;
    } else {
      const errorData = await contactResponse.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: errorData?.ErrorMessage || "Failed to create contact" }),
        { status: contactResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!contactId) {
      return new Response(JSON.stringify({ error: "Failed to retrieve contact ID" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const listRecipientResponse = await fetch("https://api.mailjet.com/v3/REST/listrecipient", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ListID: MAILJET_LIST_ID,
        ContactID: contactId
      })
    });

    if (!listRecipientResponse.ok) {
      const errorData = await listRecipientResponse.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: errorData?.ErrorMessage || "Failed to add contact to list" }),
        { status: listRecipientResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 
