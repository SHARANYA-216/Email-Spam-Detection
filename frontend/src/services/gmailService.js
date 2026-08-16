const API_BASE =
    "https://email-spam-detection-oyhu.onrender.com";

export async function getGmailAuthUrl(token) {
    const response = await fetch(
        `${API_BASE}/api/gmail/auth-url`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.json();
}

export async function getGmailInbox(token) {
    const response = await fetch(
        `${API_BASE}/api/gmail/inbox`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.json();
}

export async function getGmailEmail(messageId, token) {
    const response = await fetch(
        `${API_BASE}/api/gmail/email/${messageId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.json();
}